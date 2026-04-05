import { useState } from 'react';
import { Route as RouteIcon, Timer } from 'lucide-react';
import MapView from '../components/maps/MapView';
import TripGallery from '../components/trips/TripGallery';

interface MockTrip {
  id: number;
  title: string;
  date: string;
  distance: string;
  time: string;
  pace: string;
  elevation: string;
  routePath: string;
  photos: string[];
}

const MOCK_TRIPS: MockTrip[] = [
  {
    id: 1,
    title: 'Morning Park Loop',
    date: 'Today, 06:30 AM',
    distance: '3.2 km',
    time: '42 min',
    pace: '115 spm',
    elevation: '+45m',
    routePath: 'M 50,250 C 100,200 150,280 200,200 C 250,120 300,150 350,80',
    photos: [
      'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=400&q=80',
    ],
  },
  {
    id: 2,
    title: 'Downtown Commute',
    date: 'Yesterday, 05:15 PM',
    distance: '1.8 km',
    time: '22 min',
    pace: '120 spm',
    elevation: '+10m',
    routePath: 'M 80,280 L 150,220 L 140,150 L 220,100 L 320,120',
    photos: [
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1517502474271-e9ed4715fbc7?auto=format&fit=crop&w=400&q=80',
    ],
  },
  {
    id: 3,
    title: 'Weekend Trail Walk',
    date: 'Saturday, 09:00 AM',
    distance: '6.5 km',
    time: '1h 15m',
    pace: '105 spm',
    elevation: '+120m',
    routePath: 'M 40,200 Q 100,100 200,150 T 360,60',
    photos: [],
  },
];

export default function HistoryView() {
  const [selectedTrip, setSelectedTrip] = useState<MockTrip>(MOCK_TRIPS[0]);

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
          {MOCK_TRIPS.map((trip) => (
            <button
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedTrip.id === trip.id
                  ? 'bg-neutral-900 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-neutral-950 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-900/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className={`font-medium ${selectedTrip.id === trip.id ? 'text-white' : 'text-neutral-300'}`}>
                  {trip.title}
                </h4>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">{trip.date}</span>
              </div>
              <div className="flex gap-4 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1">
                  <RouteIcon size={12} /> {trip.distance}
                </span>
                <span className="flex items-center gap-1">
                  <Timer size={12} /> {trip.time}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Trip Detail */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Map */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-1 h-[350px] relative overflow-hidden">
            <MapView routePath={selectedTrip.routePath} title={selectedTrip.title} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Distance', value: selectedTrip.distance },
              { label: 'Duration', value: selectedTrip.time },
              { label: 'Avg Pace', value: selectedTrip.pace },
              { label: 'Elevation', value: selectedTrip.elevation, emerald: true },
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
          <TripGallery photos={selectedTrip.photos} />
        </div>
      </div>
    </div>
  );
}
