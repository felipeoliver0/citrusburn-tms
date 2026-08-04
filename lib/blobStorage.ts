import 'server-only';
import { put } from '@vercel/blob';

/**
 * Helper to validate magic bytes (file signature)
 */
function validateImageMagicBytes(buffer: Buffer): { isValid: boolean; mimeType: string } {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { isValid: true, mimeType: 'image/jpeg' };
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.length >= 8 && 
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 && 
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return { isValid: true, mimeType: 'image/png' };
  }

  // WEBP: RIFF ... WEBP
  if (buffer.length >= 12 && 
      buffer.toString('ascii', 0, 4) === 'RIFF' && 
      buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { isValid: true, mimeType: 'image/webp' };
  }

  return { isValid: false, mimeType: 'unknown' };
}

/**
 * Upload a base64 data-URL to Vercel Blob.
 * Throws an error if BLOB_READ_WRITE_TOKEN is absent to prevent database bloat.
 */
export async function uploadBase64ToBlob(base64Data: string, filename: string): Promise<string> {
  if (!base64Data || !base64Data.startsWith('data:')) return base64Data;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Vercel Blob is required to prevent database storage limits from being exceeded by Base64 strings.');
  }

  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64Data;

  const type = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  
  // 1. Size Validation (10MB)
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('Image too large. Maximum size is 10MB.');
  }

  // 2. Mime Type Whitelist (declared in base64 string)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(type)) {
    throw new Error('Invalid image format. Only JPEG, PNG, and WebP are allowed.');
  }

  // 3. Magic Bytes Validation
  const magicValidation = validateImageMagicBytes(buffer);
  if (!magicValidation.isValid || magicValidation.mimeType !== type) {
    throw new Error('File contents do not match declared image type or are corrupted.');
  }

  const ext = type.split('/')[1] || 'png';
  const name = `${filename}-${Date.now()}.${ext}`;

  const { url } = await put(`inspections/${name}`, buffer, {
    access: 'public',
    contentType: type,
  });

  return url;
}

/**
 * Upload an array of objects that may contain base64 image fields.
 */
export async function uploadArrayImages<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  filenamePrefix: string
): Promise<T[]> {
  const result = [...items];
  for (let i = 0; i < result.length; i++) {
    const value = result[i][field];
    if (typeof value === 'string' && value.startsWith('data:')) {
      result[i] = {
        ...result[i],
        [field]: await uploadBase64ToBlob(value, `${filenamePrefix}-${i}`),
      };
    }
  }
  return result;
}
