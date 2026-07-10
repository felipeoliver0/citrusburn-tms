'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type ActiveLoadMapData = {
  id: string;
  currentLat: number;
  currentLng: number;
  driverName: string;
  originCity: string;
  destCity: string;
  status: string;
};

interface FleetMapProps {
  loads: ActiveLoadMapData[];
}

// Fix for React-Leaflet Map bounding box sizing
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function FleetMap({ loads }: FleetMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-[70vh] min-h-[500px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400 border-4 border-gray-200">Loading Map Engine...</div>;

  // Default center USA
  const center: [number, number] = [39.8283, -98.5795];

  return (
    <div className="w-full h-[70vh] min-h-[500px] z-0 relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800">
      <MapContainer 
        center={center} 
        zoom={4} 
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {loads.map(load => (
          <Marker key={load.id} position={[load.currentLat, load.currentLng]} icon={truckIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="block text-sm text-brand-600 mb-1">{load.driverName}</strong>
                <p><strong>Load ID:</strong> {load.id.slice(-6).toUpperCase()}</p>
                <p><strong>Status:</strong> {load.status}</p>
                <p><strong>Route:</strong> {load.originCity} &rarr; {load.destCity}</p>
                <a href={`/load/${load.id}`} className="inline-block mt-2 text-blue-500 hover:underline">
                  View Load Details
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
