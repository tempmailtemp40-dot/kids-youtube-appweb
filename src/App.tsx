import React, { useState, useEffect } from 'react';
import { SyncState, ViewMode, Video } from './types';
import { storageService } from './services/storageService';
import { DeviceToggleHeader } from './components/DeviceToggleHeader';
import { PhoneShell } from './components/PhoneShell';
import { ParentApp } from './components/ParentApp';
import { KidApp } from './components/KidApp';
import { VideoPlayerModal } from './components/VideoPlayerModal';

export default function App() {
  const [syncState, setSyncState] = useState<SyncState>(() => storageService.loadFromStorage());
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  useEffect(() => {
    // Subscribe to live storage changes (handles multi-tab synchronization in real time)
    const unsubscribe = storageService.subscribe((newState) => {
      setSyncState(newState);
    });
    return () => unsubscribe();
  }, []);

  const handleLockParent = () => {
    setIsUnlocked(false);
  };

  const handleSelectVideoForPreview = (video: Video) => {
    setPlayingVideo(video);
  };

  const handlePlayVideoInKidApp = (video: Video) => {
    setPlayingVideo(video);
  };

  const approvedKidVideos = storageService.getKidFeedVideos(syncState);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Universal Top Header with Device View Switcher */}
      <DeviceToggleHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        syncState={syncState}
        isUnlocked={isUnlocked}
        onLockParent={handleLockParent}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full flex flex-col justify-center items-center">
        
        {/* DUAL DEVICE VIEW (Side-By-Side Android Devices) */}
        {viewMode === 'dual' && (
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8 my-auto">
            
            {/* Left Phone: Parent App */}
            <div className="w-full lg:w-1/2 flex flex-col items-center">
              <PhoneShell
                title="Parent Control App"
                badgeText="Search & Curate"
                badgeColor="bg-red-600"
                headerColor="bg-zinc-950"
              >
                <ParentApp
                  syncState={syncState}
                  onSelectVideoForPreview={handleSelectVideoForPreview}
                  isUnlocked={isUnlocked}
                  setIsUnlocked={setIsUnlocked}
                />
              </PhoneShell>
            </div>

            {/* Right Phone: Kid App */}
            <div className="w-full lg:w-1/2 flex flex-col items-center">
              <PhoneShell
                title="Kid App (YouTube Kids)"
                badgeText="Live Synced Feed"
                badgeColor="bg-amber-500 text-slate-950"
                headerColor="bg-slate-900"
              >
                <KidApp
                  syncState={syncState}
                  onPlayVideo={handlePlayVideoInKidApp}
                />
              </PhoneShell>
            </div>

          </div>
        )}

        {/* SINGLE DEVICE MODE: PARENT APP ONLY */}
        {viewMode === 'parent' && (
          <div className="w-full max-w-2xl my-auto">
            <PhoneShell
              title="YouTube Parent Control"
              badgeText="Parent Mode"
              badgeColor="bg-red-600"
              headerColor="bg-zinc-950"
              isStandalone={true}
            >
              <ParentApp
                syncState={syncState}
                onSelectVideoForPreview={handleSelectVideoForPreview}
                isUnlocked={isUnlocked}
                setIsUnlocked={setIsUnlocked}
              />
            </PhoneShell>
          </div>
        )}

        {/* SINGLE DEVICE MODE: KID APP ONLY */}
        {viewMode === 'kid' && (
          <div className="w-full max-w-2xl my-auto">
            <PhoneShell
              title="YouTube Kids App"
              badgeText="Child Feed"
              badgeColor="bg-amber-500 text-slate-950"
              headerColor="bg-slate-900"
              isStandalone={true}
            >
              <KidApp
                syncState={syncState}
                onPlayVideo={handlePlayVideoInKidApp}
              />
            </PhoneShell>
          </div>
        )}

      </main>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={playingVideo}
        onClose={() => setPlayingVideo(null)}
        approvedVideos={approvedKidVideos}
        onSelectRelatedVideo={(v) => setPlayingVideo(v)}
        isKidView={viewMode === 'kid'}
      />

    </div>
  );
}
