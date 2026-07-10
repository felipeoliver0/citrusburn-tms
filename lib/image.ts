/**
 * Utility to compress images directly in the browser using HTML5 Canvas.
 * This prevents the database from being overwhelmed by large original files (e.g. 5MB+ photos).
 * 
 * @param file The original File object from the file input
 * @param maxWidth Max width in pixels
 * @param maxHeight Max height in pixels
 * @param quality JPEG compression quality (0.0 to 1.0)
 * @param watermarkText Optional text to draw on the image (e.g. GPS coordinates)
 * @returns A Promise that resolves to a Base64 string of the compressed image
 */
export async function compressImage(
  file: File, 
  watermarkText?: string,
  maxWidth = 600, 
  maxHeight = 600, 
  quality = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Draw watermark if provided
        if (watermarkText) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black background
          ctx.fillRect(0, height - 30, width, 30);
          
          ctx.font = '14px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(watermarkText, width / 2, height - 15);
        }
        
        // Convert to highly compressed JPEG base64
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = (err) => {
        reject(new Error('Failed to load image for compression'));
      };
    };
    
    reader.onerror = (err) => {
      reject(new Error('Failed to read file'));
    };
  });
}
