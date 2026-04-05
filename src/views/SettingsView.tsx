import { useState } from 'react';
import { Cloud, HardDrive, MapPin, Image, Key, Shield, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ToggleRow from '../components/settings/ToggleRow';
import CsvImport from '../components/settings/CsvImport';
import type { MapProvider } from '../types';

export default function SettingsView() {
  const { settings, updateSettings, syncStatus, lastSynced } = useData();
  const { user, isConfigured } = useAuth();

  // Collapsible sections for advanced settings
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [showPhotoSettings, setShowPhotoSettings] = useState(false);
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);

  return (
    <div className="space-y-8 animate-in max-w-2xl">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">
          App <span className="font-semibold">Configuration</span>
        </h2>
        <p className="text-sm text-neutral-400">
          Manage how Stepsy stores your data and renders your routes.
        </p>
      </div>

      {/* ─── Drive Status ─── */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isConfigured
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-neutral-900 border border-neutral-800'
              }`}
            >
              {isConfigured ? (
                <Cloud size={18} className="text-emerald-400" />
              ) : (
                <HardDrive size={18} className="text-neutral-500" />
              )}
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">
                {isConfigured ? 'Google Drive Connected' : 'Local Storage Mode'}
              </h4>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                {isConfigured
                  ? `${user?.email} • ${syncStatus === 'synced' ? 'Synced' : syncStatus}`
                  : 'Data stored in browser only'}
              </p>
            </div>
          </div>
          {lastSynced && (
            <span className="text-[10px] font-mono text-neutral-600">
              Last sync: {lastSynced.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* How it works callout */}
        <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
          <p className="text-[10px] text-neutral-400 leading-relaxed flex items-start gap-2">
            <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong className="text-neutral-300">Zero-cost sync:</strong> Your data is stored in <em>your</em> Google Drive (15GB free).
              Stepsy never stores anything on its servers. You authenticate via OAuth — no passwords are shared.
            </span>
          </p>
        </div>
      </div>

      {/* ─── Basic Toggles ─── */}
      <div className="space-y-4">
        <ToggleRow
          label="Background Live Sync"
          description="Push data to dashboard via WorkManager."
          enabled={settings.backgroundSync}
          onChange={(v: boolean) => updateSettings({ backgroundSync: v })}
        />
        <ToggleRow
          label="High Accuracy GPS Route Logging"
          description="Draws polylines for walks over 500m. Uses more battery."
          enabled={settings.gpsRouteLogging}
          onChange={(v: boolean) => updateSettings({ gpsRouteLogging: v })}
        />
        <ToggleRow
          label="Auto-Export to CSV"
          description="Daily backup to local storage."
          enabled={settings.autoExportCSV}
          onChange={(v: boolean) => updateSettings({ autoExportCSV: v })}
          disabled={true}
        />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── Map Provider Settings ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowMapSettings(!showMapSettings)}
          className="w-full flex items-center justify-between p-6 hover:bg-neutral-900/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <MapPin size={18} className="text-blue-400" />
            </div>
            <div className="text-left">
              <h4 className="text-white font-medium text-sm">Map Provider</h4>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                {settings.mapProvider === 'leaflet' ? 'OpenStreetMap (Free)' : 'Google Maps (Your API Key)'}
              </p>
            </div>
          </div>
          {showMapSettings ? <ChevronDown size={18} className="text-neutral-500" /> : <ChevronRight size={18} className="text-neutral-500" />}
        </button>

        {showMapSettings && (
          <div className="px-6 pb-6 space-y-4 border-t border-neutral-900 pt-4">
            {/* Provider choice */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSettings({ mapProvider: 'leaflet' as MapProvider })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  settings.mapProvider === 'leaflet'
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Leaflet / OSM</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">FREE</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  OpenStreetMap tiles. No API key needed. Dark theme included.
                </p>
              </button>

              <button
                onClick={() => updateSettings({ mapProvider: 'google' as MapProvider })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  settings.mapProvider === 'google'
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Google Maps</span>
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">YOUR KEY</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  Satellite, terrain & Street View. Requires your own API key.
                </p>
              </button>
            </div>

            {/* Google Maps API Key input */}
            {settings.mapProvider === 'google' && (
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-500 uppercase">Google Maps API Key</label>
                <input
                  type="password"
                  value={settings.googleMapsApiKey}
                  onChange={(e) => updateSettings({ googleMapsApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-300 font-mono outline-none focus:border-blue-500/50 transition-colors placeholder:text-neutral-700"
                />
                <p className="text-[10px] text-neutral-600">
                  Get a free key from{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Google Cloud Console
                  </a>
                  . Enable Maps JavaScript API.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── Photo & Compression Settings ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowPhotoSettings(!showPhotoSettings)}
          className="w-full flex items-center justify-between p-6 hover:bg-neutral-900/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Image size={18} className="text-purple-400" />
            </div>
            <div className="text-left">
              <h4 className="text-white font-medium text-sm">Photos & Compression</h4>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Max {settings.photoMaxSizeMB}MB • {settings.photoMaxWidthPx}px •{' '}
                {settings.googlePhotosEnabled ? 'Google Photos linked' : 'Uploads to Drive'}
              </p>
            </div>
          </div>
          {showPhotoSettings ? <ChevronDown size={18} className="text-neutral-500" /> : <ChevronRight size={18} className="text-neutral-500" />}
        </button>

        {showPhotoSettings && (
          <div className="px-6 pb-6 space-y-5 border-t border-neutral-900 pt-4">
            {/* Compression settings */}
            <div>
              <h5 className="text-xs font-mono text-neutral-400 uppercase mb-3">Compression (before upload)</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-neutral-500 mb-1.5 block">Max File Size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.3"
                      max="5"
                      step="0.1"
                      value={settings.photoMaxSizeMB}
                      onChange={(e) => updateSettings({ photoMaxSizeMB: parseFloat(e.target.value) })}
                      className="flex-1 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-xs font-mono text-neutral-300 w-12 text-right">{settings.photoMaxSizeMB}MB</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-500 mb-1.5 block">Max Width</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="800"
                      max="4096"
                      step="128"
                      value={settings.photoMaxWidthPx}
                      onChange={(e) => updateSettings({ photoMaxWidthPx: parseInt(e.target.value) })}
                      className="flex-1 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-xs font-mono text-neutral-300 w-14 text-right">{settings.photoMaxWidthPx}px</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-neutral-600 mt-2">
                Photos are compressed in-browser before uploading to save your Drive space.
              </p>
            </div>

            {/* Photo storage destination */}
            <div className="space-y-3">
              <h5 className="text-xs font-mono text-neutral-400 uppercase">Storage Destination</h5>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-lg border text-left ${
                    !settings.googlePhotosEnabled
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-neutral-800 bg-neutral-900/30'
                  }`}
                >
                  <p className="text-xs font-medium text-white mb-0.5">Google Drive</p>
                  <p className="text-[10px] text-neutral-500">Default. Stored in Stepsy/ folder.</p>
                </div>
                <button
                  onClick={() => updateSettings({ googlePhotosEnabled: !settings.googlePhotosEnabled })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.googlePhotosEnabled
                      ? 'border-purple-500/30 bg-purple-500/5'
                      : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-medium text-white">Google Photos</p>
                    <span className="text-[8px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">API KEY</span>
                  </div>
                  <p className="text-[10px] text-neutral-500">For advanced users. Saves Drive space.</p>
                </button>
              </div>
            </div>

            {/* Google Photos API Key */}
            {settings.googlePhotosEnabled && (
              <div className="space-y-2 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                <label className="text-xs font-mono text-neutral-500 uppercase">Google Photos API Key</label>
                <input
                  type="password"
                  value={settings.googlePhotosApiKey}
                  onChange={(e) => updateSettings({ googlePhotosApiKey: e.target.value })}
                  placeholder="Enter your Google Photos API key..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-300 font-mono outline-none focus:border-purple-500/50 transition-colors placeholder:text-neutral-700"
                />
                <p className="text-[10px] text-neutral-600">
                  Enable{' '}
                  <a href="https://console.cloud.google.com/apis/library/photoslibrary.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    Photos Library API
                  </a>
                  {' '}in your Google Cloud Console and add the scope.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── Advanced: Custom API Keys ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowAdvancedApi(!showAdvancedApi)}
          className="w-full flex items-center justify-between p-6 hover:bg-neutral-900/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Key size={18} className="text-amber-400" />
            </div>
            <div className="text-left">
              <h4 className="text-white font-medium text-sm">Advanced: Custom API</h4>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                {settings.useCustomDriveApi ? 'Using your own Google Cloud project' : 'Using Stepsy Sync (default)'}
              </p>
            </div>
          </div>
          {showAdvancedApi ? <ChevronDown size={18} className="text-neutral-500" /> : <ChevronRight size={18} className="text-neutral-500" />}
        </button>

        {showAdvancedApi && (
          <div className="px-6 pb-6 space-y-4 border-t border-neutral-900 pt-4">
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <p className="text-[10px] text-neutral-400 leading-relaxed flex items-start gap-2">
                <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-neutral-300">For developers:</strong> By default, Stepsy uses a shared OAuth project ("Stepsy Sync") — your data still lives in <em>your</em> Drive.
                  If you want full control, create your own Google Cloud project and enter the credentials below.
                </span>
              </p>
            </div>

            <ToggleRow
              label="Use Custom Google Cloud Project"
              description="Provide your own Client ID and API Key instead of Stepsy Sync."
              enabled={settings.useCustomDriveApi}
              onChange={(v: boolean) => updateSettings({ useCustomDriveApi: v })}
            />

            {settings.useCustomDriveApi && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-neutral-500 uppercase mb-1.5 block">OAuth Client ID</label>
                  <input
                    type="text"
                    value={settings.customClientId}
                    onChange={(e) => updateSettings({ customClientId: e.target.value })}
                    placeholder="123456789.apps.googleusercontent.com"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-300 font-mono outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-neutral-500 uppercase mb-1.5 block">API Key</label>
                  <input
                    type="password"
                    value={settings.customApiKey}
                    onChange={(e) => updateSettings({ customApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-300 font-mono outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-700"
                  />
                </div>
                <p className="text-[10px] text-neutral-600">
                  Create a project at{' '}
                  <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                    Google Cloud Console
                  </a>
                  , enable Drive API, and create OAuth 2.0 credentials. No credit card required.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CSV Import ─── */}
      <div>
        <h3 className="text-xs font-mono text-neutral-500 uppercase mb-4 tracking-wider">
          Data Management
        </h3>
        <CsvImport />
      </div>

      {/* ─── API Endpoint ─── */}
      <div className="pt-8 border-t border-neutral-900">
        <h4 className="text-xs font-mono text-neutral-500 uppercase mb-4">API Endpoint URL</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value="https://stepsy.live/api/sync-webhook"
            readOnly
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-neutral-300 font-mono outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText('https://stepsy.live/api/sync-webhook')}
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
