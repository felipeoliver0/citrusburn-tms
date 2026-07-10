import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

async function uploadBase64ToBlob(base64Data: string, filename: string): Promise<string> {
  if (!base64Data || !base64Data.startsWith('data:')) return base64Data;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('Vercel Blob token not found. Skipping upload.');
    return base64Data;
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Data;

    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = type.split('/')[1] || 'png';
    const name = `${filename}-${Date.now()}.${ext}`;

    const { url } = await put(`migrations/${name}`, buffer, {
      access: 'public',
      contentType: type,
    });

    console.log(`Uploaded ${filename} -> ${url}`);
    return url;
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error);
    return base64Data;
  }
}

async function migrate() {
  console.log('Starting migration to Vercel Blob...');
  const loads = await prisma.load.findMany();
  console.log(`Found ${loads.length} loads to check.`);

  let migratedCount = 0;

  for (const load of loads) {
    let updated = false;
    const updateData: any = {};

    // Check simple string fields
    const stringFields = [
      'driverSignature',
      'pickupVinPhoto',
      'podDocumentUrl',
      'deliverySignature',
      'deliveryVinPhoto'
    ] as const;

    for (const field of stringFields) {
      const val = load[field] as string | null;
      if (val && val.startsWith('data:')) {
        const url = await uploadBase64ToBlob(val, `${field}-${load.id}`);
        if (url !== val) {
          updateData[field] = url;
          updated = true;
        }
      }
    }

    // Check JSON fields with nested arrays (pickupPhotos, deliveryPhotos, pickupDamages, deliveryDamages)
    const jsonFields = ['pickupPhotos', 'deliveryPhotos', 'pickupDamages', 'deliveryDamages'] as const;

    for (const field of jsonFields) {
      let jsonVal = load[field] as any;
      if (!jsonVal) continue;
      
      // If it's a string, try parsing it
      if (typeof jsonVal === 'string') {
        try {
          jsonVal = JSON.parse(jsonVal);
        } catch {
          continue;
        }
      }

      if (Array.isArray(jsonVal)) {
        let fieldUpdated = false;
        for (let i = 0; i < jsonVal.length; i++) {
          const item = jsonVal[i];
          // Determine if it uses .photo or .base64
          if (item && item.photo && item.photo.startsWith('data:')) {
            item.photo = await uploadBase64ToBlob(item.photo, `${field}-${load.id}-${i}`);
            fieldUpdated = true;
          } else if (item && item.base64 && item.base64.startsWith('data:')) {
            item.base64 = await uploadBase64ToBlob(item.base64, `${field}-${load.id}-${i}`);
            fieldUpdated = true;
          }
        }

        if (fieldUpdated) {
          updateData[field] = jsonVal;
          updated = true;
        }
      }
    }

    if (updated) {
      await prisma.load.update({
        where: { id: load.id },
        data: updateData,
      });
      migratedCount++;
      console.log(`Migrated load ${load.id}`);
    }
  }

  console.log(`Migration completed. Migrated ${migratedCount} loads.`);
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
