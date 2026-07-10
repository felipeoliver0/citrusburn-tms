'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">
      Loading Maps Engine...
    </div>
  ),
});

export default function MapWrapper({ loadId, initialLat, initialLng }: { loadId: string, initialLat: number, initialLng: number }) {
  const [speed, setSpeed] = useState(0);
  const [lastPing, setLastPing] = useState<Date>(new Date());

  const handleTelemetryUpdate = useCallback((newSpeed: number, ping: Date) => {
    setSpeed(newSpeed);
    setLastPing(ping);
  }, []);

  return (
    <div className="space-y-4">
      <LiveMap loadId={loadId} initialLat={initialLat} initialLng={initialLng} onTelemetryUpdate={handleTelemetryUpdate} />
      
      {/* Telemetry Panel */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-white">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Telemetry Data</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Status</div>
            <div className={`font-bold ${speed > 0 ? 'text-brand-400' : 'text-amber-400'}`}>
              {speed > 0 ? 'Moving' : 'Stopped'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Speed</div>
            <div className="font-bold text-lg">{speed} <span className="text-xs font-normal text-gray-400">mph</span></div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Last Ping</div>
            <div className="font-bold text-sm">{lastPing.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
