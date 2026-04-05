import { useData } from '../../context/DataContext';
import LeafletMap from './LeafletMap';
import GoogleMapsMap from './GoogleMapsMap';
import FuturisticMap from '../trips/FuturisticMap';
import type { LatLng } from '../../types';

interface Props {
  routeCoords?: LatLng[];
  routePath?: string;
  title?: string;
}

/**
 * Map provider switcher.
 * - 'leaflet' (default): Free, no API key, dark CartoDB tiles
 * - 'google': Requires user's own Google Maps API key
 * - Falls back to SVG FuturisticMap if no coords and has SVG path
 */
export default function MapView({ routeCoords, routePath, title }: Props) {
  const { settings } = useData();

  // If we have GPS coordinates, use the selected map provider
  if (routeCoords && routeCoords.length >= 2) {
    if (settings.mapProvider === 'google' && settings.googleMapsApiKey) {
      return (
        <GoogleMapsMap
          routeCoords={routeCoords}
          apiKey={settings.googleMapsApiKey}
          title={title}
        />
      );
    }
    return <LeafletMap routeCoords={routeCoords} title={title} />;
  }

  // For legacy trips with SVG paths, Leaflet can generate approximate coords
  if (routePath) {
    if (settings.mapProvider === 'leaflet') {
      return <LeafletMap routePath={routePath} title={title} />;
    }
    // Google Maps needs real coords — fall back to SVG map
    return <FuturisticMap routePath={routePath} />;
  }

  // No route data at all
  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl border border-neutral-900 bg-neutral-950 flex items-center justify-center">
      <p className="text-sm text-neutral-600 font-mono">No route data available</p>
    </div>
  );
}
