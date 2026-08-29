import { get, set, del } from 'idb-keyval';
import type { DamageMarkerData } from '@/app/components/DamageMarker';

export interface InspectionDraft {
  step: number;
  vin: string;
  vinPhoto: string;
  vehiclePhotos: { part: string; base64: string }[];
  damages: DamageMarkerData[];
  signature: string;
  podFileBase64?: string;
}

const getDraftKey = (loadId: string, type: 'pickup' | 'delivery') => `inspection_draft_${loadId}_${type}`;

export async function saveInspectionDraft(loadId: string, type: 'pickup' | 'delivery', data: InspectionDraft): Promise<void> {
  try {
    const key = getDraftKey(loadId, type);
    await set(key, data);
  } catch (err) {
    console.error('Failed to save inspection draft to IndexedDB:', err);
  }
}

export async function loadInspectionDraft(loadId: string, type: 'pickup' | 'delivery'): Promise<InspectionDraft | undefined> {
  try {
    const key = getDraftKey(loadId, type);
    return await get<InspectionDraft>(key);
  } catch (err) {
    console.error('Failed to load inspection draft from IndexedDB:', err);
    return undefined;
  }
}

export async function clearInspectionDraft(loadId: string, type: 'pickup' | 'delivery'): Promise<void> {
  try {
    const key = getDraftKey(loadId, type);
    await del(key);
  } catch (err) {
    console.error('Failed to clear inspection draft from IndexedDB:', err);
  }
}
