import React from 'react';
import { ViewMode, SyncState } from '../types';
import { ShieldCheck, Tv, LayoutGrid, Smartphone, RefreshCw, Lock, Sparkles } from 'lucide-react';

interface DeviceToggleHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  syncState: SyncState;
  isUnlocked: boolean;
  onLockParent: () => void;
}

export const DeviceToggleHeader: React.FC<DeviceToggleHeaderProps> = ({
  viewMode,
  setViewMode,
  syncState,
  isUnlocked,
  onLockParent,
}) => {
  const activeKeywordsCount = syncState.keywords.filter((k) => k.enabled).length;
  const manualCount = syncState.manuallyAddedVideos.length;
  const uploadCount = syncState.uploadedVideos.length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand Logo & Sync Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-1.5 rounded-xl shadow font-bold text-sm tracking-wide">
            <Tv className="w-5 h-5" />
            <span>YT Kids Sync</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">Live Android Sync Active</span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setViewMode('parent')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'parent'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-red-300" />
            <span>Parent App</span>
            {isUnlocked && syncState.settings.pinEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setViewMode('kid')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'kid'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>Kid App</span>
          </button>

          <button
            onClick={() => setViewMode('dual')}
            className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'dual'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-300" />
            <span>Dual Screen (Side-by-Side)</span>
          </button>
        </div>

        {/* Stats Pill & Lock Controls */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden lg:flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <span>Keywords: <strong className="text-red-400">{activeKeywordsCount}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Manual: <strong className="text-amber-400">{manualCount}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Uploads: <strong className="text-sky-400">{uploadCount}</strong></span>
          </div>

          {syncState.settings.pinEnabled && isUnlocked && (
            <button
              onClick={onLockParent}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
              title="Lock Parent App"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Lock</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
