// ---- Shared Types for the Stepsy App ----

export interface StepRecord {
  date: string;        // YYYY-MM-DD
  steps: number;
}

export interface StepsData {
  version: number;
  records: StepRecord[];
}

// GPS coordinate for route polylines
export interface LatLng {
  lat: number;
  lng: number;
}

export type MapProvider = 'leaflet' | 'google';

export interface Trip {
  id: string;
  title: string;
  date: string;          // ISO string
  distance: number;       // km
  duration: number;       // seconds
  pace: number;           // steps per minute
  elevation: number;      // meters
  routePath: string;      // SVG path d-attribute (legacy / fallback)
  routeCoords?: LatLng[]; // GPS coordinates for Leaflet/Google Maps
  photoIds: string[];     // Google Drive file IDs or URLs
}

export interface TripsData {
  version: number;
  trips: Trip[];
}

export interface AppSettings {
  version: number;
  dailyGoal: number;
  backgroundSync: boolean;
  gpsRouteLogging: boolean;
  autoExportCSV: boolean;

  // Map provider: 'leaflet' (free, default) or 'google' (requires user's API key)
  mapProvider: MapProvider;
  googleMapsApiKey: string;

  // Google Photos: opt-in (techy users provide their own API)
  googlePhotosEnabled: boolean;
  googlePhotosApiKey: string;

  // Optional: power users can use their own Google Cloud project
  useCustomDriveApi: boolean;
  customClientId: string;
  customApiKey: string;

  // Photo compression settings
  photoMaxSizeMB: number;       // Max file size after compression (default: 1)
  photoMaxWidthPx: number;      // Max width in pixels (default: 1920)
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export type TabId = 'dashboard' | 'history' | 'achievements' | 'settings';

export interface WeeklyBarData {
  day: string;
  steps: number;
  date: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string; // icon name key
  status: 'unlocked' | 'in-progress' | 'locked';
  progress?: number;     // 0-100
  progressLabel?: string;
  unlockedDate?: string;
  color: string; // tailwind color key like 'emerald', 'blue', 'rose'
}
