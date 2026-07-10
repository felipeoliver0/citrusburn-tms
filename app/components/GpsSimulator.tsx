'use client';

import { useState, useRef } from 'react';
import { Route, Loader2 } from 'lucide-react';
import { fetchRouteCoordinates } from './simulatorActions';

interface GpsSimulatorProps {
  origin: string;
  dest: string;
}

export default function GpsSimulator({ origin, dest }: GpsSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const routeRef = useRef<{lat: number, lng: number}[]>([]);

  const startSimulation = async () => {
    setIsLoadingRoute(true);
    const coords = await fetchRouteCoordinates(origin, dest);
    setIsLoadingRoute(false);

    if (!coords || coords.length === 0) {
      alert("Could not load real road data. Please try again or check addresses.");
      return;
    }

    routeRef.current = coords;
    indexRef.current = 0;
    setIsSimulating(true);

    // Loop every 5 seconds, advancing on the real road coordinates
    timerRef.current = setInterval(() => {
      if (indexRef.current >= routeRef.current.length) {
        stopSimulation();
        return;
      }
      
      const currentPoint = routeRef.current[indexRef.current];
      sendPing(currentPoint.lat, currentPoint.lng);
      
      // Advance by 3 points (roughly 50-100m depending on the road) to simulate speed
      indexRef.current += 3; 
    }, 5000);
  };

  const sendPing = async (lat: number, lng: number) => {
    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
    } catch (e) {
      console.error('Simulator error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <button 
      onClick={isSimulating ? stopSimulation : (isLoadingRoute ? undefined : startSimulation)}
      disabled={isLoadingRoute}
      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
        isSimulating ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] animate-pulse' 
        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50'
      }`}
    >
      {isLoadingRoute ? <Loader2 size={18} className="animate-spin" /> : <Route size={18} />} 
      {isLoadingRoute ? 'Loading Route Data...' : isSimulating ? '🛑 Stop GPS Simulator' : '🧪 Start GPS Simulator'}
    </button>
  );
}
