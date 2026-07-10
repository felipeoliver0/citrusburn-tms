'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icons in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/713/713311.png', // Truck icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Componente para centralizar o mapa na nova posição suavemente e forçar renderização
function MapUpdater({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    // Force Leaflet to recalculate its container size so tiles load properly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    map.setView([lat, lng], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
}

// Haversine formula to calculate distance between two GPS points in miles
function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function LiveMap({ loadId, initialLat, initialLng, onTelemetryUpdate }: { 
  loadId: string, 
  initialLat: number, 
  initialLng: number,
  onTelemetryUpdate?: (speed: number, lastPing: Date) => void
}) {
  const [coords, setCoords] = useState<{lat: number, lng: number}>({ lat: initialLat, lng: initialLng });
  const [history, setHistory] = useState<[number, number][]>([]);
  const [status, setStatus] = useState<string>('IN_TRANSIT');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [speed, setSpeed] = useState<number>(0);
  const prevCoords = useRef<{lat: number, lng: number, time: number}>({ lat: initialLat, lng: initialLng, time: Date.now() });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/location/${loadId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lat && data.lng) {
            const now = Date.now();
            const prev = prevCoords.current;
            
            // Calculate speed: distance / time
            const distMiles = getDistanceMiles(prev.lat, prev.lng, data.lat, data.lng);
            const timeDiffHours = (now - prev.time) / (1000 * 60 * 60); // ms to hours
            
            let calculatedSpeed = 0;
            if (timeDiffHours > 0 && distMiles > 0.001) { // Only calculate if moved > ~5 feet
              calculatedSpeed = Math.round(distMiles / timeDiffHours);
              // Cap at reasonable truck speed
              if (calculatedSpeed > 85) calculatedSpeed = 85;
            }

            setCoords({ lat: data.lat, lng: data.lng });
            if (data.history && Array.isArray(data.history)) {
              setHistory(data.history.map((h: any) => [h.lat, h.lng]));
            }
            setStatus(data.status);
            setSpeed(calculatedSpeed);
            setLastUpdated(new Date());
            
            // Update ref for next calculation
            prevCoords.current = { lat: data.lat, lng: data.lng, time: now };

            // Notify parent
            if (onTelemetryUpdate) {
              onTelemetryUpdate(calculatedSpeed, new Date());
            }
          }
        }
      } catch (err) {
        console.error('Error fetching live location:', err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // Atualiza a cada 3 segundos
    const interval = setInterval(fetchLocation, 3000);
    return () => clearInterval(interval);
  }, [loadId, onTelemetryUpdate]);

  return (
    <div className="relative w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0">
      
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${speed > 0 ? 'bg-green-500' : 'bg-amber-400'}`}></div>
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            {speed > 0 ? 'Live GPS Active' : 'GPS — Stationary'}
          </span>
        </div>
        <div className="text-[10px] text-gray-500">
          Last ping: {lastUpdated.toLocaleTimeString()} • {speed} mph
        </div>
      </div>

      <MapContainer 
        center={[coords.lat, coords.lng]} 
        zoom={14} 
        style={{ height: '500px', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {history.length > 0 && (
          <Polyline positions={history} color="#3b82f6" weight={5} opacity={0.7} dashArray="10, 10" />
        )}

        <Marker position={[coords.lat, coords.lng]} icon={customIcon}>
          <Popup>
            <div className="text-center font-sans">
              <strong className="block text-brand-600">Truck {speed > 0 ? 'Moving' : 'Stopped'}</strong>
              <span className="text-xs text-gray-500">Speed: {speed} mph</span>
            </div>
          </Popup>
        </Marker>
        <MapUpdater lat={coords.lat} lng={coords.lng} />
      </MapContainer>

    </div>
  );
}
