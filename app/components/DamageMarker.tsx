'use client';

import { useState, useRef, MouseEvent } from 'react';

export type DamageCode = 'S' | 'D' | 'C' | 'CR' | 'M' | 'F' | 'G' | 'P';

export const DAMAGE_CODES: Record<DamageCode, string> = {
  S: 'Scratch',
  D: 'Dent',
  C: 'Chipped',
  CR: 'Cracked',
  M: 'Missing',
  F: 'Faded',
  G: 'Gouge',
  P: 'Peeling',
};

export interface DamageMarkerData {
  id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  code: DamageCode;
}

interface DamageMarkerProps {
  value: DamageMarkerData[];
  onChange?: (val: DamageMarkerData[]) => void;
  readOnly?: boolean;
}

export default function DamageMarker({ value, onChange, readOnly = false }: DamageMarkerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pendingMarker, setPendingMarker] = useState<{x: number, y: number} | null>(null);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    
    // Ignore click if clicking on an existing marker or popup
    if ((e.target as HTMLElement).closest('.damage-marker-element')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingMarker({ x, y });
  };

  const handleSelectCode = (code: DamageCode) => {
    if (!pendingMarker || !onChange) return;
    onChange([...value, { id: Date.now().toString(), x: pendingMarker.x, y: pendingMarker.y, code }]);
    setPendingMarker(null);
  };

  const removeMarker = (id: string) => {
    if (readOnly || !onChange) return;
    onChange(value.filter(m => m.id !== id));
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      
      {!readOnly && (
        <p className="text-xs text-gray-500 mb-2">Tap the car to mark damages.</p>
      )}

      <div 
        ref={containerRef} 
        className="relative w-48 h-96 bg-gray-50 border border-gray-200 rounded cursor-crosshair overflow-hidden shadow-inner"
        onClick={handleClick}
      >
        {/* Car Top-Down SVG */}
        <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          {/* Wheels */}
          <rect x="15" y="30" width="10" height="25" rx="3" fill="#334155"/>
          <rect x="75" y="30" width="10" height="25" rx="3" fill="#334155"/>
          <rect x="15" y="145" width="10" height="25" rx="3" fill="#334155"/>
          <rect x="75" y="145" width="10" height="25" rx="3" fill="#334155"/>
          
          {/* Body */}
          <rect x="20" y="10" width="60" height="180" rx="15" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
          
          {/* Windows */}
          <path d="M 25 55 Q 50 45 75 55 L 70 80 L 30 80 Z" fill="#94a3b8" />
          <path d="M 25 145 Q 50 155 75 145 L 70 115 L 30 115 Z" fill="#94a3b8" />
          
          {/* Roof */}
          <rect x="30" y="80" width="40" height="35" fill="#cbd5e1"/>
          
          {/* Headlights */}
          <rect x="25" y="12" width="12" height="6" rx="2" fill="#fbbf24"/>
          <rect x="63" y="12" width="12" height="6" rx="2" fill="#fbbf24"/>
          
          {/* Taillights */}
          <rect x="25" y="182" width="12" height="6" rx="2" fill="#ef4444"/>
          <rect x="63" y="182" width="12" height="6" rx="2" fill="#ef4444"/>
        </svg>

        {/* Render Saved Markers */}
        {value.map(marker => (
          <div 
            key={marker.id}
            className="damage-marker-element absolute flex items-center justify-center w-6 h-6 -ml-3 -mt-3 bg-red-600 text-white text-[10px] font-bold rounded-full shadow cursor-pointer border border-white hover:scale-110 transition-transform"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            onClick={() => removeMarker(marker.id)}
            title={DAMAGE_CODES[marker.code]}
          >
            {marker.code}
          </div>
        ))}

        {/* Pending Marker Popup */}
        {pendingMarker && !readOnly && (
          <div 
            className="damage-marker-element absolute bg-white shadow-xl border border-gray-200 p-2 rounded-lg z-10 -ml-20 mt-3 grid grid-cols-2 gap-1 w-40"
            style={{ left: `${pendingMarker.x}%`, top: `${pendingMarker.y}%` }}
          >
            {Object.entries(DAMAGE_CODES).map(([code, label]) => (
              <button
                key={code}
                type="button"
                className="text-[9px] bg-gray-50 hover:bg-brand-100 text-gray-700 py-1.5 px-1 rounded font-bold uppercase"
                onClick={() => handleSelectCode(code as DamageCode)}
              >
                {code} <span className="font-normal block text-[7px] text-gray-400">{label}</span>
              </button>
            ))}
            <button 
              type="button" 
              className="col-span-2 text-[9px] text-red-500 font-bold mt-1"
              onClick={() => setPendingMarker(null)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {!readOnly && value.length > 0 && (
        <div className="mt-4 w-full text-xs">
          <p className="font-bold text-gray-600 uppercase mb-2 text-[10px]">Marked Damages ({value.length})</p>
          <div className="flex flex-wrap gap-2">
            {value.map(v => (
              <span key={v.id} className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-bold">
                {v.code}: {DAMAGE_CODES[v.code]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
