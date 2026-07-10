import 'server-only';
import { put } from '@vercel/blob';

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
