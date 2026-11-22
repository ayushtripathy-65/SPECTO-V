import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Wifi,
  WifiOff,
  UserCheck,
  Flame,
  Moon,
  Sun,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PresetProfile, SAMPLE_PROFILES } from '../mock/sampleUsers';

interface Props {
  mode: 'DATASHADOW' | 'TRADITIONAL';
  onToggleMode: (mode: 'DATASHADOW' | 'TRADITIONAL') => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  lastPingTime: string;
  queuedCount: number;
  onSelectProfile: (profile: PresetProfile) => void;
  onTriggerRejectionTest: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<Props> = ({
  mode,
  onToggleMode,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  lastPingTime,
  queuedCount,
  onSelectProfile,
  onTriggerRejectionTest,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                DataShadow Web
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                Zero-Trust
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Browser-First Personal Data Architecture &bull; Client Compute &bull; Minimization
            </p>
          </div>
        </div>

        {/* Center / Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onToggleMode('DATASHADOW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'DATASHADOW'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DataShadow</span>
            </button>
            <button
              onClick={() => onToggleMode('TRADITIONAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'TRADITIONAL'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Traditional</span>
            </button>
          </div>

          {/* Network Simulator Toggle */}
          <button
            onClick={onToggleSimulatedOffline}
            title={isSimulatedOffline ? 'Simulating Offline Network' : 'Network Active'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSimulatedOffline
                ? 'bg-amber-950/80 text-amber-300 border-amber-700 animate-pulse'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulated Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Online</span>
              </>
            )}
            {queuedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                {queuedCount} Q
              </span>
            )}
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Preset Profile Loader */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Load Sample</span>
            </button>
            <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Select Demo Applicant:
              </div>
              {SAMPLE_PROFILES.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition group/item"
                >
                  <div className="text-xs font-medium text-slate-200 group-hover/item:text-cyan-400">
                    {profile.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{profile.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Server Rejection Test Demo Button */}
          <button
            onClick={onTriggerRejectionTest}
            title="Deliberately send raw sensitive data to demonstrate server-side blocking"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-medium rounded-lg border border-rose-800 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline">Test Server Rejection</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-950 border border-slate-800"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Offline Alert Strip */}
      {isSimulatedOffline && (
        <div className="bg-amber-950/90 border-t border-amber-800 px-4 py-1.5 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>
            <strong>Simulated Offline Mode Active.</strong> Local evaluations run entirely in Web
            Worker. Remote hybrid tasks are queued safely on client.
          </span>
        </div>
      )}
    </header>
  );
};
