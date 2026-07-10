'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Custom SVG Icon for Leaflet
const customIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="width: 32px; height: 32px; background-color: #f97316; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Full list of coordinates matching the seeded cities and others
const MOCK_COORDS: Record<string, [number, number]> = {
  'Orlando': [28.5383, -81.3792],
  'Miami': [25.7617, -80.1918],
  'New York': [40.7128, -74.0060],
  'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298],
  'Houston': [29.7604, -95.3698],
  'Dallas': [32.7767, -96.7970],
  'Atlanta': [33.7490, -84.3880],
  'Austin': [30.2672, -97.7431],
  'Seattle': [47.6062, -122.3321],
  'Denver': [39.7392, -104.9903],
  'Las Vegas': [36.1699, -115.1398],
  'London': [51.5074, -0.1278],
  'Paris': [48.8566, 2.3522],
  'Tokyo': [35.6762, 139.6503],
  'Sydney': [-33.8688, 151.2093],
  'Sao Paulo': [-23.5505, -46.6333],
  'Cape Town': [-33.9249, 18.4241],
  'Toronto': [43.6510, -79.3470],
  'Dubai': [25.2048, 55.2708],
  'Singapore': [1.3521, 103.8198],
  'Mumbai': [19.0760, 72.8777],
  'Berlin': [52.5200, 13.4050],
  'Moscow': [55.7558, 37.6173],
  'Mexico City': [19.4326, -99.1332],
  'Buenos Aires': [-34.6037, -58.3816],
  'Cairo': [30.0444, 31.2357],
  'Beijing': [39.9042, 116.4074],
};

function getCoords(cityName: string): [number, number] | null {
  if (!cityName) return null;
  // Try to find a matching city in MOCK_COORDS even if cityName has state (e.g. "Miami, FL")
  const key = Object.keys(MOCK_COORDS).find(k => cityName.includes(k));
  if (key) return MOCK_COORDS[key];
  return null;
}

export default function MapViewer({ loads }: { loads: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const center: [number, number] = [20, 0]; // Center of the World

  return (
    <MapContainer 
      center={center} 
      zoom={2} 
      style={{ height: '100%', minHeight: '600px', width: '100%', background: '#f8fafc' }}
      zoomControl={false}
      attributionControl={false}
    >
      <MapResizer />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      
      {loads.map(load => {
        // Attempt to mock a coordinate if it matches, otherwise random near center
        const coords = getCoords(load.originCity);
        const lat = coords ? coords[0] : center[0] + (Math.random() - 0.5) * 10;
        const lng = coords ? coords[1] : center[1] + (Math.random() - 0.5) * 10;

        return (
          <Marker key={load.id} position={[lat, lng]} icon={customIcon}>
            <Popup className="custom-popup">
              <div className="font-sans text-gray-900 font-bold p-1">
                <div className="text-brand-600 text-lg">${load.price}</div>
                <div className="text-xs uppercase text-gray-500 mt-1">{load.originCity} &rarr; {load.destCity}</div>
                <div className="text-xs mt-2 text-gray-700">{load.distance} mi</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
