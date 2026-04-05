import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../../types';

interface Props {
  routeCoords?: LatLng[];
  routePath?: string;       // SVG fallback path for legacy trips
  title?: string;
}

// Fix Leaflet default marker icons (broken in bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Dark map tile layer (free, no API key needed)
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Generate fake coords from SVG path for demo purposes
function generateCoordsFromSvgPath(svgPath: string): LatLng[] {
  // Parse SVG path numbers and map to realistic GPS coordinates
  // Center around a generic location (Patna, India area)
  const baseLat = 25.6;
  const baseLng = 85.1;
  
  const numbers = svgPath.match(/[\d.]+/g)?.map(Number) || [];
  const coords: LatLng[] = [];
  
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = numbers[i];
    const y = numbers[i + 1];
    coords.push({
      lat: baseLat + (300 - y) * 0.003,
      lng: baseLng + (x - 50) * 0.003,
    });
  }
  
  // Ensure at least 2 points
  if (coords.length < 2) {
    coords.push({ lat: baseLat, lng: baseLng });
    coords.push({ lat: baseLat + 0.01, lng: baseLng + 0.01 });
  }
  
  return coords;
}

export default function LeafletMap({ routeCoords, routePath, title }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const coords = routeCoords ?? (routePath ? generateCoordsFromSvgPath(routePath) : []);
    if (coords.length === 0) return;

    const center: L.LatLngExpression = [
      coords.reduce((s, c) => s + c.lat, 0) / coords.length,
      coords.reduce((s, c) => s + c.lng, 0) / coords.length,
    ];

    const map = L.map(mapRef.current, {
      center,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(DARK_TILE_URL, {
      attribution: DARK_TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Add attribution in bottom-right, small
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    // Draw route polyline
    const latLngs: L.LatLngExpression[] = coords.map(c => [c.lat, c.lng]);
    
    // Glow effect (wider, transparent line behind)
    L.polyline(latLngs, {
      color: '#34d399',
      weight: 8,
      opacity: 0.15,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Main route line
    L.polyline(latLngs, {
      color: '#34d399',
      weight: 3,
      opacity: 0.9,
      dashArray: '8, 6',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Start marker
    const startIcon = L.divIcon({
      html: '<div style="width:12px;height:12px;border-radius:50%;background:#000;border:2px solid #fff;box-shadow:0 0 8px rgba(255,255,255,0.3);"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      className: '',
    });
    L.marker(latLngs[0], { icon: startIcon }).addTo(map);

    // End marker (pulsing green)
    const endIcon = L.divIcon({
      html: '<div style="width:12px;height:12px;border-radius:50%;background:#34d399;border:2px solid #000;box-shadow:0 0 12px rgba(52,211,153,0.8);animation:pulse 2s infinite;"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      className: '',
    });
    L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(map);

    // Fit bounds with padding
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [40, 40] });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [routeCoords, routePath]);

  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl relative overflow-hidden border border-neutral-900">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* GPS Active badge overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
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
      
      {/* Leaflet label */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-black/40 backdrop-blur px-2 py-1 rounded text-[8px] font-mono text-neutral-600">
          OpenStreetMap • Free
        </div>
      </div>
    </div>
  );
}
