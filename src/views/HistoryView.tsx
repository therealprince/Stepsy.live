import { useState, useMemo } from 'react';
import { Route as RouteIcon, Timer, Camera } from 'lucide-react';
import MapView from '../components/maps/MapView';
import TripGallery from '../components/trips/TripGallery';
import { useData } from '../context/DataContext';
import type { Trip } from '../types';

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${timeStr}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryView() {
  const { tripsData } = useData();
  const trips = tripsData.trips;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first trip
  const selectedTrip = useMemo<Trip | null>(() => {
    if (trips.length === 0) return null;
    if (selectedId) return trips.find((t) => t.id === selectedId) || trips[0];
    return trips[0];
  }, [trips, selectedId]);

  if (trips.length === 0) {
    return (
      <div className="space-y-6 animate-in h-full flex flex-col">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">
            Trips & <span className="font-semibold">Routes</span>
          </h2>
          <p className="text-sm text-neutral-400">
            Walks over 500m are automatically tracked and mapped.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
              <RouteIcon size={24} className="text-neutral-600" />
            </div>
            <h3 className="text-lg text-neutral-400 mb-1">No trips recorded yet</h3>
            <p className="text-sm text-neutral-600 max-w-sm">
              Start walking with GPS enabled and your routes will appear here automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">
          Trips & <span className="font-semibold">Routes</span>
        </h2>
        <p className="text-sm text-neutral-400">
          Walks over 500m are automatically tracked and mapped.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Trip List */}
        <div className="lg:col-span-4 space-y-3">
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => setSelectedId(trip.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedTrip?.id === trip.id
                  ? 'bg-neutral-900 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-neutral-950 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-900/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className={`font-medium ${selectedTrip?.id === trip.id ? 'text-white' : 'text-neutral-300'}`}>
                  {trip.title}
                </h4>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  {formatRelativeDate(trip.date)}
                </span>
              </div>
              <div className="flex gap-4 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1">
                  <RouteIcon size={12} /> {trip.distance.toFixed(1)} km
                </span>
                <span className="flex items-center gap-1">
                  <Timer size={12} /> {formatDuration(trip.duration)}
                </span>
                {trip.photoIds.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Camera size={12} /> {trip.photoIds.length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Trip Detail */}
        {selectedTrip && (
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Map */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-1 h-[350px] relative overflow-hidden">
              <MapView
                routeCoords={selectedTrip.routeCoords}
                routePath={selectedTrip.routePath}
                title={selectedTrip.title}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Distance', value: `${selectedTrip.distance.toFixed(1)} km` },
                { label: 'Duration', value: formatDuration(selectedTrip.duration) },
                { label: 'Avg Pace', value: `${selectedTrip.pace} spm` },
                { label: 'Elevation', value: `+${selectedTrip.elevation}m`, emerald: true },
              ].map((stat) => (
                <div key={stat.label} className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4">
                  <p className="text-[10px] text-neutral-500 font-mono uppercase mb-1">{stat.label}</p>
                  <p className={`text-xl font-semibold ${stat.emerald ? 'text-emerald-400' : 'text-white'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Gallery */}
            <TripGallery photos={selectedTrip.photoIds} tripId={selectedTrip.id} />
          </div>
        )}
      </div>
    </div>
  );
}
