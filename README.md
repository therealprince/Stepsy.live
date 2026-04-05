# Stepsy — Zero-Cost Step Tracking Dashboard

A privacy-first step tracking dashboard that stores all data in **your own Google Drive**. No servers, no subscriptions, no data harvesting.

![Stepsy Dashboard](https://img.shields.io/badge/cost-$0%20forever-emerald?style=flat-square) ![React](https://img.shields.io/badge/react-19-blue?style=flat-square) ![TypeScript](https://img.shields.io/badge/typescript-strict-blue?style=flat-square) ![Vite](https://img.shields.io/badge/vite-5-purple?style=flat-square)

## Features

- 📊 **Real-time Dashboard** — Live step counter, weekly trends, calories, distance
- 🗺️ **Leaflet Maps** — Free dark-themed OpenStreetMap (no API key needed)
- 🏆 **Achievements** — Dynamic badges based on your step data
- 📷 **Photo Gallery** — Compressed before upload to save Drive space
- 📁 **CSV Import** — Drag-drop your step data files
- 🔒 **Privacy** — Data lives in YOUR Google Drive, not our servers

## Architecture

```
Your Browser → OAuth Token → Your Google Drive (15GB free)
    ↑                            ↑
    └── IndexedDB cache          └── Stepsy/ folder + appDataFolder
```

**Zero cost for the developer.** Each user's data is stored in their own Google Drive.

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/stepsy.git
cd stepsy
npm install
npm run dev
```

The app starts in **Demo Mode** by default (no Google API needed).

## Google Drive Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → "Stepsy Sync"
3. Enable **Google Drive API**
4. **OAuth Consent Screen** → External → Add app name
5. **Credentials** → Create OAuth 2.0 Client ID (Web app)
6. Add `http://localhost:5173` to authorized origins
7. Copy credentials to `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key
```

## Deploy to Vercel (Free)

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com/new](https://vercel.com/new) — it auto-deploys on push.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Maps | Leaflet (default) / Google Maps (optional) |
| Icons | Lucide React |
| Storage | Google Drive API + IndexedDB cache |
| Auth | Google Identity Services (OAuth 2.0) |
| Images | browser-image-compression |

## License

MIT
