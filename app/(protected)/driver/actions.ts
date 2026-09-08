'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { createNotification } from '@/lib/notifications';
import { SubmitInspectionSchema } from '@/lib/validations';
import { deleteBlob } from '@/lib/blobStorage';
import { transitionLoad } from '@/lib/loadState';
import { Role } from '@prisma/client';

export async function submitInspectionAction(formData: FormData) {
  const { userId, role } = await getSession();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  if (role !== 'DRIVER') {
    throw new Error('Forbidden');
  }

  const rawLoadId = formData.get('loadId') as string;
  const rawType = formData.get('type') as string;
  const rawVin = formData.get('vin') as string;
  const rawVinPhoto = formData.get('vinPhoto') as string;
  const rawDamages = formData.get('damages') as string;
  const rawVehiclePhotos = formData.get('vehiclePhotos') as string;
  const rawSignature = formData.get('signature') as string;

  const parsed = SubmitInspectionSchema.safeParse({
    loadId: rawLoadId,
    type: rawType,
    vin: rawVin,
    vinPhoto: rawVinPhoto,
    damagesRaw: rawDamages,
    vehiclePhotosRaw: rawVehiclePhotos,
    signature: rawSignature,
  });

  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.issues[0].message}`);
  }

  const { loadId, type, vin, vinPhoto, damagesRaw, vehiclePhotosRaw, signature } = parsed.data;
  
  if (!vin && !vinPhoto) {
    throw new Error('You must provide either a VIN or a VIN Photo');
  }

  let damages: any[];
  let vehiclePhotos: any[];
  try {
    damages = JSON.parse(damagesRaw || '[]');
    vehiclePhotos = JSON.parse(vehiclePhotosRaw || '[]');
    if (!Array.isArray(damages) || !Array.isArray(vehiclePhotos)) throw new Error();
  } catch {
    throw new Error('Invalid inspection data format');
  }
  const podBase64 = formData.get('podBase64') as string | null;

  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) throw new Error('Load not found');

  if (load.driverId !== userId) {
    throw new Error('Forbidden: Driver is not assigned to this load');
  }

  if (type === 'pickup') {
    if (load.status !== 'BOOKED') {
      throw new Error('Load must be BOOKED before pickup');
    }
  }

  if (type === 'delivery') {
    if (load.status !== 'IN_TRANSIT') {
      throw new Error('Load must be IN_TRANSIT before delivery');
    }
  }

  // Phase 1 is now handled by the client-side Vercel Blob SDK
  // We just extract the uploaded URLs from the payload for rollback purposes
  const successfulUrls: string[] = [];

  const uploadedVinPhoto = vinPhoto && vinPhoto.startsWith('http') ? vinPhoto : null;
  if (uploadedVinPhoto) successfulUrls.push(uploadedVinPhoto);

  const uploadedSignature = signature && signature.startsWith('http') ? signature : null;
  if (uploadedSignature) successfulUrls.push(uploadedSignature);

  const uploadedPod = podBase64 && podBase64.startsWith('http') ? podBase64 : null;
  if (uploadedPod) successfulUrls.push(uploadedPod);

  for (let i = 0; i < damages.length; i++) {
    if (damages[i].photo && damages[i].photo.startsWith('http')) {
      successfulUrls.push(damages[i].photo);
    }
  }

  for (let i = 0; i < vehiclePhotos.length; i++) {
    if (vehiclePhotos[i].base64 && vehiclePhotos[i].base64.startsWith('http')) {
      successfulUrls.push(vehiclePhotos[i].base64);
    }
  }

  // PHASE 2: Database Transaction
  const inspectionType = type === 'pickup' ? 'PICKUP' : 'DELIVERY';

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inspection.create({
        data: {
          loadId,
          type: inspectionType,
          inspectorId: userId,
          vin: vin || null,
          vinPhoto: uploadedVinPhoto,
          signature: uploadedSignature,
          photos: {
            create: vehiclePhotos.map((p: any) => ({ 
              photoUrl: p.base64 || p.photoUrl || p.url || p,
              description: p.label || p.description || null
            }))
          },
          damages: {
            create: damages.map((d: any) => ({
              x: d.x,
              y: d.y,
              damageCode: d.code || d.damageCode || 'UNKNOWN',
              severity: d.severity || null
            }))
          }
        }
      });

      // To keep it simple, we use the regular functions, but since transitionLoad has its own db calls,
      // we pass the transaction `tx` natively so it executes atomically.
      if (type === 'pickup') {
        await transitionLoad(loadId, 'IN_TRANSIT', userId, role as Role, {}, tx);
      } else {
        await transitionLoad(loadId, 'DELIVERED', userId, role as Role, {
          ...(uploadedPod ? { podDocumentUrl: uploadedPod } : {})
        }, tx);
      }
    });

  } catch (error: any) {
    // Database failure -> Cleanup blobs
    await Promise.allSettled(successfulUrls.map(url => deleteBlob(url)));
    throw new Error('Database transaction failed. Uploads were rolled back. ' + error.message);
  }

  // PHASE 3: Notifications (Non-critical)
  try {
    if (type === 'pickup') {
      await createNotification(
        load.brokerId,
        'Load Picked Up',
        `Load #${loadId.substring(0,6).toUpperCase()} has been picked up and is in transit.`,
        `/track/${loadId}`
      );
      if (load.carrierId) {
        await createNotification(load.carrierId, 'Load Picked Up', `Driver has picked up load #${loadId.substring(0,6).toUpperCase()}.`, `/track/${loadId}`);
      }
    } else {
      await createNotification(
        load.brokerId,
        'Load Delivered',
        `Load #${loadId.substring(0,6).toUpperCase()} has been delivered successfully!`,
        `/load/${loadId}`
      );
      if (load.carrierId) {
        await createNotification(load.carrierId, 'Load Delivered', `Driver has delivered load #${loadId.substring(0,6).toUpperCase()}.`, `/load/${loadId}`);
      }
    }
  } catch (e) {
    console.error("Failed to send notifications", e);
  }

  return { success: true };
}
