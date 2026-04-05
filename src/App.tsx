import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import LoginScreen from './components/auth/LoginScreen';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import MobileHeader from './components/layout/MobileHeader';
import UserAvatar from './components/auth/UserAvatar';
import DashboardView from './views/DashboardView';
import HistoryView from './views/HistoryView';
import AchievementsView from './views/AchievementsView';
import SettingsView from './views/SettingsView';
import type { TabId } from './types';

function AppContent() {
  const { isSignedIn, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-mono">Initializing...</p>
        </div>
      </div>
    );
  }

  // Login gate
  if (!isSignedIn) {
    return <LoginScreen />;
  }

  return (
    <DataProvider>
      <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-emerald-500/30 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
          {/* Background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Mobile Header */}
          <MobileHeader />

          {/* User avatar (desktop) */}
          <div className="hidden md:block absolute top-6 right-6 lg:top-10 lg:right-10 z-20">
            <UserAvatar />
          </div>

          {/* Page content */}
          <div className="max-w-6xl mx-auto p-6 lg:p-10 relative z-10">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'history' && <HistoryView />}
            {activeTab === 'achievements' && <AchievementsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
