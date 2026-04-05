import { Footprints, ArrowRight, Shield, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { signIn, enterDemoMode, isLoading, error, isConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="login-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#34d399" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>

      <div className="relative z-10 max-w-sm w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Footprints className="text-emerald-400" size={26} />
          </div>
        </div>

        <h1 className="text-4xl font-light tracking-tight text-white mb-2">
          stepsy<span className="text-emerald-400 font-bold">.live</span>
        </h1>
        <p className="text-neutral-500 text-sm mb-10 leading-relaxed">
          Zero-cost step tracking dashboard.
          <br />
          Your data lives in <span className="text-neutral-300">your</span> Google Drive.
        </p>

        {/* Sign in with Google — always visible */}
        <button
          onClick={signIn}
          disabled={isLoading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-3 ${
            isConfigured
              ? 'bg-white hover:bg-neutral-100 text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]'
              : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isLoading ? 'Connecting...' : 'Sign in with Google'}
        </button>

        {/* Demo mode */}
        <button
          onClick={enterDemoMode}
          className="w-full py-3 px-6 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-sm transition-all flex items-center justify-center gap-2"
        >
          Try Demo Mode <ArrowRight size={14} />
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* Status message based on API configuration */}
        {!isConfigured ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-[10px] text-amber-400/70 font-mono">
              <Shield size={12} />
              Google API not configured — using demo mode
            </div>
            <p className="text-[10px] text-neutral-700 leading-relaxed">
              Developer: add <code className="text-neutral-500">VITE_GOOGLE_CLIENT_ID</code> and{' '}
              <code className="text-neutral-500">VITE_GOOGLE_API_KEY</code> to <code className="text-neutral-500">.env</code> to enable Google Sign-In.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-emerald-400/70 font-mono">
            <Globe size={12} />
            Google Drive API connected — ready
          </div>
        )}

        {/* Privacy note */}
        <div className="mt-10 space-y-2">
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            We never store your data on our servers.
            <br />
            All step data, photos, and settings live in your own Google Drive.
          </p>
        </div>
      </div>
    </div>
  );
}
