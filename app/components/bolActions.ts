'use server';

export async function getImageUrlAsBase64(url: string): Promise<string | null> {
  try {
    if (!url || !url.startsWith('http')) return null;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/png';
    const base64 = Buffer.from(buffer).toString('base64');
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error in getImageUrlAsBase64:", error);
    return null;
  }
}
