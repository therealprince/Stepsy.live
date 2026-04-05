import { useEffect, useRef } from 'react';
import type { LatLng } from '../../types';

// The Google Maps script is loaded dynamically based on user's API key
// We use `any` here because @types/google.maps is huge and optional
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const google: any;

interface Props {
  routeCoords?: LatLng[];
  apiKey: string;
  title?: string;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export default function GoogleMapsMap({ routeCoords, apiKey, title }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !apiKey || !routeCoords?.length) return;

    let cancelled = false;

    loadGoogleMapsScript(apiKey).then(() => {
      if (cancelled || !mapRef.current) return;

      const center = {
        lat: routeCoords.reduce((s, c) => s + c.lat, 0) / routeCoords.length,
        lng: routeCoords.reduce((s, c) => s + c.lng, 0) / routeCoords.length,
      };

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#525252' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#262626' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });

      // Route polyline
      new google.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: '#34d399',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        map,
      });

      // Glow polyline
      new google.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: '#34d399',
        strokeOpacity: 0.15,
        strokeWeight: 8,
        map,
      });

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      routeCoords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, 40);

      mapInstance.current = map;
    }).catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [routeCoords, apiKey]);

  if (!apiKey) {
    return (
      <div className="w-full h-full min-h-[300px] rounded-2xl border border-neutral-900 bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-neutral-400 mb-1">Google Maps requires an API key</p>
          <p className="text-[10px] text-neutral-600 font-mono">Settings → Map Provider → Enter API Key</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl relative overflow-hidden border border-neutral-900">
      <div ref={mapRef} className="w-full h-full" />
      
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-black/60 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-full text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          GPS Active
        </div>
        {title && (
          <div className="bg-black/60 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-full text-[10px] font-mono text-neutral-400">
            {title}
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/40 backdrop-blur px-2 py-1 rounded text-[8px] font-mono text-neutral-600">
          Google Maps • Your API Key
        </div>
      </div>
    </div>
  );
}
