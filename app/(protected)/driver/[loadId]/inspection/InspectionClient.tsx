'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import DamageMarker, { DamageMarkerData } from '@/app/components/DamageMarker';
import { submitInspectionAction } from '../../actions';
import { Camera, CheckCircle2, ChevronRight, MapPin, Target, ShieldAlert, PenTool, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';

interface InspectionClientProps {
  loadId: string;
  type: 'pickup' | 'delivery';
  origin: string;
  dest: string;
  initialVin: string;
}

export default function InspectionClient({ loadId, type, origin, dest, initialVin }: InspectionClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vin, setVin] = useState(initialVin);
  const [vinPhoto, setVinPhoto] = useState('');
  
  // Fotos das 4 partes (Frente, Traseira, Esquerda, Direita)
  const [vehiclePhotos, setVehiclePhotos] = useState<{ part: string, base64: string }[]>([]);

  const [damages, setDamages] = useState<DamageMarkerData[]>([]);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [podFileBase64, setPodFileBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handlePodUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file, 1200);
      setPodFileBase64(base64);
    }
  };

  const handleVinPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file, 800);
      setVinPhoto(base64);
    }
  };

  const handleVehiclePhotoUpload = async (part: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file, 800);
      setVehiclePhotos(prev => {
        // Replace se já existir, senão adiciona
        const existing = prev.filter(p => p.part !== part);
        return [...existing, { part, base64 }];
      });
    }
  };

  const hasPhoto = (part: string) => vehiclePhotos.some(p => p.part === part);

  const handleSubmit = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Please provide a signature.');
      return;
    }

    if (type === 'delivery' && !podFileBase64) {
      alert('Please upload the signed Proof of Delivery (POD) document.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const signature = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '';
      const formData = new FormData();
      formData.append('loadId', loadId);
      formData.append('type', type);
      formData.append('vin', vin);
      formData.append('vinPhoto', vinPhoto);
      formData.append('damages', JSON.stringify(damages));
      formData.append('vehiclePhotos', JSON.stringify(vehiclePhotos));
      formData.append('signature', signature);
      if (type === 'delivery' && podFileBase64) {
        formData.append('podBase64', podFileBase64);
      }

      await submitInspectionAction(formData);

      router.push('/driver');
      router.refresh();
    } catch (e: any) {
      console.error('Inspection submit error:', e);
      alert(`Error submitting inspection: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = type === 'pickup' ? 'Pickup Inspection' : 'Delivery Inspection';
  const themeColor = type === 'pickup' ? 'text-brand-400' : 'text-green-400';
  const themeBg = type === 'pickup' ? 'bg-brand-500' : 'bg-green-500';

  const CAR_PARTS = ['Front', 'Back', 'Left Side', 'Right Side'];

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in text-gray-900 pb-24">
      
      {/* Header */}
      <header className="mb-8">
        <h1 className={`text-2xl font-extrabold tracking-tight ${themeColor}`}>
          {title}
        </h1>
        <p className="text-gray-500 mt-1 text-xs uppercase font-bold tracking-wider">Load #{loadId.slice(-6)}</p>
      </header>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? themeBg : 'bg-gray-200'}`}></div>
        ))}
      </div>

      {/* Step 1: Verification */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-6 animate-slide-up">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className={`p-2 rounded-xl ${themeBg}/20 ${themeColor}`}>
              <Camera size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Vehicle Verification</h2>
              <p className="text-gray-500 text-xs">Verify routing and capture VIN</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4 items-center">
               <MapPin className="text-brand-400 shrink-0" />
               <div>
                 <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Origin</div>
                 <div className="text-sm font-medium text-gray-900">{origin}</div>
               </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4 items-center">
               <Target className="text-green-400 shrink-0" />
               <div>
                 <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Destination</div>
                 <div className="text-sm font-medium text-gray-900">{dest}</div>
               </div>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-2 tracking-wider">Vehicle VIN (17 Digits)</label>
            <input 
              type="text" 
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase())}
              placeholder="Enter VIN manually"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center font-mono text-lg text-gray-900 focus:outline-none focus:border-brand-500 transition-colors placeholder:text-gray-400 mb-4"
            />

            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                capture="environment"
                onChange={handleVinPhotoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 font-bold transition-colors ${vinPhoto ? 'border-green-500 text-green-500 bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                {vinPhoto ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                {vinPhoto ? 'VIN Photo Captured' : 'Take VIN Photo'}
              </div>
            </div>
          </div>

          <button 
            disabled={vin.length < 5 && !vinPhoto}
            onClick={handleNext}
            className={`w-full py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${vin.length >= 5 || vinPhoto ? `${themeBg} text-white shadow-lg` : 'bg-gray-100 text-gray-400'}`}
          >
            Continue <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 2: Damages & Photos */}
      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-6 animate-slide-up">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Vehicle Photos & Damages</h2>
              <p className="text-gray-500 text-xs">Capture all 4 angles and mark damages</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs uppercase text-gray-500 font-bold tracking-wider">Required Photos</label>
            <div className="grid grid-cols-2 gap-3">
              {CAR_PARTS.map(part => (
                <div key={part} className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleVehiclePhotoUpload(part, e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-colors ${hasPhoto(part) ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    {hasPhoto(part) ? <CheckCircle2 size={16} /> : <Camera size={16} />}
                    {part}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-xs uppercase text-gray-500 font-bold tracking-wider mb-3">Damage Map (Optional)</label>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <DamageMarker value={damages} onChange={setDamages} />
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={handlePrev} className="py-4 px-6 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              Back
            </button>
            <button 
              onClick={handleNext} 
              disabled={vehiclePhotos.length < 4}
              className={`flex-1 py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${vehiclePhotos.length === 4 ? `${themeBg} text-white shadow-lg` : 'bg-gray-100 text-gray-400'}`}
            >
              Review & Sign <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Signature & POD Upload */}
      {step === 3 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-6 animate-slide-up">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className={`p-2 rounded-xl ${themeBg}/20 ${themeColor}`}>
              <PenTool size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Sign & Complete</h2>
              <p className="text-gray-500 text-xs">{type === 'pickup' ? 'Shipper' : 'Receiver'} Confirmation</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed text-justify">
              I agree that the vehicle has been {type === 'pickup' ? 'picked up' : 'delivered'} in the condition shown in the damage report and photos. I authorize this electronic signature to be applied to the official Bill of Lading (BOL).
            </p>
            
            <div className="bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-200">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: "w-full h-48 signature-canvas" }} 
              />
            </div>
            <button onClick={() => sigCanvas.current?.clear()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase font-bold tracking-wider">
              Clear Signature
            </button>
          </div>

          {type === 'delivery' && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-sm text-brand-500">Proof of Delivery (POD)</h3>
              <p className="text-xs text-gray-500">Please capture a photo of the signed document to process payment.</p>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handlePodUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 font-bold transition-colors ${podFileBase64 ? 'border-brand-500 text-brand-500 bg-brand-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  {podFileBase64 ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                  {podFileBase64 ? 'Document Attached' : 'Capture POD Document'}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button onClick={handlePrev} className="py-4 px-6 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              Back
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 ${isSubmitting ? 'opacity-50' : ''} ${themeBg}`}
            >
              {isSubmitting ? 'Saving...' : <><CheckCircle2 size={18} /> Complete {type === 'pickup' ? 'Pickup' : 'Delivery'}</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
