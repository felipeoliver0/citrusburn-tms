'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { createNotification } from '@/lib/notifications';
import { SubmitInspectionSchema } from '@/lib/validations';
import { uploadBase64ToBlob } from '@/lib/blobStorage';
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

  // Process uploads concurrently for speed
  const uploadedVinPhoto = vinPhoto ? await uploadBase64ToBlob(vinPhoto, `vin-${loadId}`) : null;
  const uploadedSignature = signature ? await uploadBase64ToBlob(signature, `sig-${loadId}`) : null;
  const uploadedPod = podBase64 ? await uploadBase64ToBlob(podBase64, `pod-${loadId}`) : null;

  // Upload damages photos
  for (let i = 0; i < damages.length; i++) {
    if (damages[i].photo) {
      damages[i].photo = await uploadBase64ToBlob(damages[i].photo, `damage-${loadId}-${i}`);
    }
  }

  // Upload vehicle photos
  for (let i = 0; i < vehiclePhotos.length; i++) {
    if (vehiclePhotos[i].base64) {
      vehiclePhotos[i].base64 = await uploadBase64ToBlob(vehiclePhotos[i].base64, `vehicle-${loadId}-${i}`);
    }
  }

  const inspectionType = type === 'pickup' ? 'PICKUP' : 'DELIVERY';

  await prisma.inspection.create({
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

  if (type === 'pickup') {
    await transitionLoad(loadId, 'IN_TRANSIT', userId, role as Role, {});

    await createNotification(
      load.brokerId,
      'Load Picked Up',
      `Load #${loadId.substring(0,6).toUpperCase()} has been picked up and is in transit.`,
      `/track/${loadId}`
    );
    if (load.carrierId) {
      await createNotification(load.carrierId, 'Load Picked Up', `Driver has picked up load #${loadId.substring(0,6).toUpperCase()}.`, `/track/${loadId}`);
    }
  } else if (type === 'delivery') {
    await transitionLoad(loadId, 'DELIVERED', userId, role as Role, {
      ...(uploadedPod ? { podDocumentUrl: uploadedPod } : {})
    });

    await createNotification(
      load.brokerId,
      'Load Delivered',
      `Load #${loadId.substring(0,6).toUpperCase()} has been delivered successfully!`,
      `/load/${loadId}`
    );
    if (load.carrierId) {
      await createNotification(load.carrierId, 'Load Delivered', `Driver has delivered load #${loadId.substring(0,6).toUpperCase()}.`, `/load/${loadId}`);
    }
  } else {
    throw new Error('Invalid inspection type');
  }

  return { success: true };
}
