'use client';

import { useEffect, useRef } from 'react';

export default function DriverTracker() {
  const isTracking = useRef(false);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    
    // Prevent multiple instances
    if (isTracking.current) return;
    isTracking.current = true;

    console.log('[TMS Tracker] GPS Tracking Initiated');

    const sendLocation = async (lat: number, lng: number) => {
      try {
        await fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
          // keepalive ensures the request finishes even if the user closes the tab
          keepalive: true
        });
      } catch (error) {
        console.error('[TMS Tracker] Failed to send location', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Watch position in the foreground continuously
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Enviar a posição real
        sendLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('[TMS Tracker] Geolocation error:', error instanceof Error ? error.message : 'Unknown error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // 10 seconds
        timeout: 10000
      }
    );

    // Fallback: Ping periodically in case watchPosition stalls
    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(position.coords.latitude, position.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }, 15000); // A cada 15 segundos

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
      isTracking.current = false;
    };
  }, []);

  return null; // Invisible component
}
