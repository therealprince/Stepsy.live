// Demo data generator — creates realistic step data for preview
import type { StepRecord, Trip, TripsData, StepsData } from '../types';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate 30 days of realistic step records */
export function generateDemoSteps(): StepsData {
  const records: StepRecord[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Weekday vs weekend pattern
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseSteps = isWeekend ? randomBetween(4000, 15000) : randomBetween(6000, 12000);

    // Some variation — "lazy days" and "active days"
    const variation = Math.random();
    let steps = baseSteps;
    if (variation < 0.1) steps = randomBetween(1000, 3000);   // Lazy day
    if (variation > 0.9) steps = randomBetween(15000, 22000); // Very active day

    records.push({ date: dateStr, steps });
  }

  return { version: 1, records };
}

/** Generate 3 demo trips */
export function generateDemoTrips(): TripsData {
  const today = new Date();

  const trips: Trip[] = [
    {
      id: 'demo-trip-1',
      title: 'Morning Park Loop',
      date: today.toISOString(),
      distance: 3.2,
      duration: 2520,
      pace: 115,
      elevation: 45,
      routePath: 'M 50,250 C 100,200 150,280 200,200 C 250,120 300,150 350,80',
      routeCoords: [
        { lat: 25.612, lng: 85.100 },
        { lat: 25.618, lng: 85.108 },
        { lat: 25.625, lng: 85.112 },
        { lat: 25.630, lng: 85.118 },
        { lat: 25.636, lng: 85.125 },
        { lat: 25.640, lng: 85.130 },
        { lat: 25.645, lng: 85.128 },
        { lat: 25.648, lng: 85.135 },
      ],
      photoIds: [
        'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=400&q=80',
      ],
    },
    {
      id: 'demo-trip-2',
      title: 'Downtown Commute',
      date: new Date(today.getTime() - 86400000).toISOString(),
      distance: 1.8,
      duration: 1320,
      pace: 120,
      elevation: 10,
      routePath: 'M 80,280 L 150,220 L 140,150 L 220,100 L 320,120',
      routeCoords: [
        { lat: 25.605, lng: 85.095 },
        { lat: 25.610, lng: 85.102 },
        { lat: 25.614, lng: 85.110 },
        { lat: 25.620, lng: 85.115 },
        { lat: 25.625, lng: 85.120 },
      ],
      photoIds: [
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1517502474271-e9ed4715fbc7?auto=format&fit=crop&w=400&q=80',
      ],
    },
    {
      id: 'demo-trip-3',
      title: 'Weekend Trail Walk',
      date: new Date(today.getTime() - 3 * 86400000).toISOString(),
      distance: 6.5,
      duration: 4500,
      pace: 105,
      elevation: 120,
      routePath: 'M 40,200 Q 100,100 200,150 T 360,60',
      routeCoords: [
        { lat: 25.590, lng: 85.080 },
        { lat: 25.598, lng: 85.090 },
        { lat: 25.610, lng: 85.098 },
        { lat: 25.622, lng: 85.105 },
        { lat: 25.635, lng: 85.112 },
        { lat: 25.645, lng: 85.120 },
        { lat: 25.655, lng: 85.128 },
      ],
      photoIds: [],
    },
  ];

  return { version: 1, trips };
}
