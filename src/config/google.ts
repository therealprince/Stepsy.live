// Google API configuration
// To set up: create a project at https://console.cloud.google.com
// Enable: Google Drive API, Google Picker API
// Create OAuth 2.0 Client ID (Web application)
// Add authorized origins: http://localhost:5173 and your production URL

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

export const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
];

// File names stored in appDataFolder
export const DRIVE_FILES = {
  STEPS: 'stepsy_steps.json',
  ROUTES: 'stepsy_routes.json',
  SETTINGS: 'stepsy_settings.json',
} as const;

// Visible folder in user's Drive for photos
export const STEPSY_PHOTOS_FOLDER = 'Stepsy';

export const DEFAULT_SETTINGS = {
  version: 2,
  dailyGoal: 10000,
  backgroundSync: true,
  gpsRouteLogging: true,
  autoExportCSV: false,

  // Maps: Leaflet is free & default, Google Maps requires user's own key
  mapProvider: 'leaflet' as const,
  googleMapsApiKey: '',

  // Google Photos: off by default, techy users enable with own API
  googlePhotosEnabled: false,
  googlePhotosApiKey: '',

  // Custom Drive API: off by default, uses developer's Stepsy Sync project
  useCustomDriveApi: false,
  customClientId: '',
  customApiKey: '',

  // Photo compression: compress before uploading to save Drive space
  photoMaxSizeMB: 1,
  photoMaxWidthPx: 1920,
};

export const isGoogleConfigured = (): boolean => {
  return GOOGLE_CLIENT_ID !== '' && GOOGLE_API_KEY !== '';
};
