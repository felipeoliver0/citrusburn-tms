'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type LiveTrackerMapProps = {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  originCity: string;
  destCity: string;
  currentLat?: number | null;
  currentLng?: number | null;
  history: { lat: number; lng: number }[];
};

export default function LiveTrackerMap({
  originLat,
  originLng,
  destLat,
  destLng,
  originCity,
  destCity,
  currentLat,
  currentLng,
  history
}: LiveTrackerMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full min-h-[500px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 border border-gray-200">Loading Map Engine...</div>;

  // Try to center the map on the truck, otherwise the first history point, otherwise a default coordinate (USA center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  
  const center: [number, number] = currentLat && currentLng 
    ? [currentLat, currentLng] 
    : history.length > 0 
      ? [history[0].lat, history[0].lng] 
      : defaultCenter;

  const polylinePositions: [number, number][] = history.map(p => [p.lat, p.lng]);

  return (
    <div className="w-full h-full min-h-[500px] z-0 relative rounded-xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer 
        center={center} 
        zoom={history.length > 0 ? 8 : 4} 
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        scrollWheelZoom={false}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Origin Marker (if coordinates were available) */}
        {originLat && originLng && (
          <Marker position={[originLat, originLng]} icon={originIcon}>
            <Popup>
              <strong>Origin:</strong> {originCity}
            </Popup>
          </Marker>
        )}

        {/* Destination Marker (if coordinates were available) */}
        {destLat && destLng && (
          <Marker position={[destLat, destLng]} icon={destIcon}>
            <Popup>
              <strong>Destination:</strong> {destCity}
            </Popup>
          </Marker>
        )}

        {/* Breadcrumb Trail */}
        {polylinePositions.length > 0 && (
          <Polyline 
            positions={polylinePositions} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.7} 
            dashArray="10, 10" 
          />
        )}

        {/* Current Driver Position */}
        {currentLat && currentLng && (
          <Marker position={[currentLat, currentLng]} icon={truckIcon}>
            <Popup>
              <strong>Driver's Current Location</strong>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
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
