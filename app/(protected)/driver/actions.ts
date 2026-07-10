'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { createNotification } from '@/lib/notifications';
import { SubmitInspectionSchema } from '@/lib/validations';
import { uploadBase64ToBlob } from '@/lib/blobStorage';

export async function submitInspectionAction(formData: FormData) {
  const { userId } = await getSession();

  if (!userId) {
    throw new Error('Unauthorized');
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

  // Process uploads concurrently for speed
  const uploadedVinPhoto = vinPhoto ? await uploadBase64ToBlob(vinPhoto, `vin-${loadId}`) : '';
  const uploadedSignature = signature ? await uploadBase64ToBlob(signature, `sig-${loadId}`) : '';
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

  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) throw new Error('Load not found');

  if (load.driverId !== userId && load.carrierId !== userId) {
    throw new Error('Forbidden: You do not own this load');
  }

  if (type === 'pickup') {
    await prisma.load.update({
      where: { id: loadId },
      data: {
        pickupVin: vin,
        pickupVinPhoto: uploadedVinPhoto,
        pickupDamages: damages,
        pickupPhotos: vehiclePhotos,
        driverSignature: uploadedSignature,
        status: 'IN_TRANSIT'
      }
    });

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
    await prisma.load.update({
      where: { id: loadId },
      data: {
        deliveryVin: vin,
        deliveryVinPhoto: uploadedVinPhoto,
        deliveryDamages: damages,
        deliveryPhotos: vehiclePhotos,
        deliverySignature: uploadedSignature,
        status: 'DELIVERED',
        ...(uploadedPod ? { podDocumentUrl: uploadedPod } : {})
      }
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
  }

  return { success: true };
}
