'use server';

import { getSession } from '@/lib/dal';
import { isRateLimited } from '@/lib/rateLimit';

export async function fetchRouteCoordinates(origin: string, dest: string) {
  try {
    const { userId } = await getSession();
    if (!userId) {
      console.error("Unauthorized access to simulatorActions");
      return null;
    }

    if (await isRateLimited(`simulator:${userId}`, 10)) {
      console.error("Rate limit exceeded for simulatorActions");
      return null;
    }

    // 1. Geocode Origin
    const originRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin)}&format=json&limit=1`, { headers: { 'User-Agent': 'AxleGrid-TMS' } });
    const originData = await originRes.json();
    if (!originData || originData.length === 0) return null;
    const originLat = parseFloat(originData[0].lat);
    const originLon = parseFloat(originData[0].lon);

    // 2. Geocode Destination
    const destRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dest)}&format=json&limit=1`, { headers: { 'User-Agent': 'AxleGrid-TMS' } });
    const destData = await destRes.json();
    if (!destData || destData.length === 0) return null;
    const destLat = parseFloat(destData[0].lat);
    const destLon = parseFloat(destData[0].lon);

    // 3. Get OSRM Route
    const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson`);
    const osrmData = await osrmRes.json();
    
    if (osrmData.routes && osrmData.routes.length > 0) {
      // OSRM returns GeoJSON coordinates in [lon, lat] format
      const coords = osrmData.routes[0].geometry.coordinates;
      return coords.map((c: number[]) => ({ lat: c[1], lng: c[0] }));
    }
    return null;
  } catch (error) {
    console.error('Simulator error fetching route:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
