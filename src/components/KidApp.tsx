import React, { useState } from 'react';
import { SyncState, Video } from '../types';
import { storageService } from '../services/storageService';
import { Play, Sparkles, Tv, Search, Heart, ShieldCheck, Smile, Star, Volume2, Filter } from 'lucide-react';

interface KidAppProps {
  syncState: SyncState;
  onPlayVideo: (video: Video) => void;
}

export const KidApp: React.FC<KidAppProps> = ({ syncState, onPlayVideo }) => {
  const [selectedFilterKeyword, setSelectedFilterKeyword] = useState<string>('all');
  const [kidSearchQuery, setKidSearchQuery] = useState<string>('');

  // Get full approved kid feed
  const allKidVideos = storageService.getKidFeedVideos(syncState);

  // Active enabled keyword strings
  const activeKeywords = syncState.keywords.filter((k) => k.enabled).map((k) => k.text);

  // Filter feed based on chosen chip or search query within approved list
  const filteredVideos = allKidVideos.filter((video) => {
    // Search filter inside kid app (only searches approved list)
    if (kidSearchQuery.trim()) {
      const q = kidSearchQuery.toLowerCase().trim();
      const matchTitle = video.title.toLowerCase().includes(q);
      const matchDesc = video.description.toLowerCase().includes(q);
      const matchTag = video.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    // Keyword Filter Chip
    if (selectedFilterKeyword === 'all') return true;
    if (selectedFilterKeyword === 'uploads') return video.isParentUpload;
    if (selectedFilterKeyword === 'selected') return video.isManuallySelected;

    // Specific keyword filter (e.g. "tom and jerry", "bugs bunny show")
    const kw = selectedFilterKeyword.toLowerCase();
    return (
      video.title.toLowerCase().includes(kw) ||
      video.description.toLowerCase().includes(kw) ||
      video.tags.some((t) => t.toLowerCase().includes(kw)) ||
      (video.keywordMatched && video.keywordMatched.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white min-h-full">
      
      {/* YouTube Kids App Vibrant Header Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white p-3 sm:p-4 shadow-lg border-b border-amber-400/30">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Kid Name */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-200 transform -rotate-3">
              <Tv className="w-5 h-5 fill-red-600 text-red-600" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base sm:text-lg tracking-wide text-white drop-shadow">
                  YouTube Kids
                </span>
                <span className="bg-amber-300 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                  Safe
                </span>
              </div>
              <p className="text-[11px] text-amber-100 font-semibold flex items-center space-x-1">
                <span>{syncState.settings.kidAvatar} {syncState.settings.kidName}'s Personal Feed</span>
              </p>
            </div>
          </div>

          {/* Safe Badge */}
          <div className="flex items-center space-x-1 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full border border-white/30 text-xs font-bold text-white shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-300 fill-emerald-300/40" />
            <span className="hidden sm:inline">Parent Approved</span>
          </div>
        </div>

        {/* Kid Search Bar (Restricted strictly to approved items!) */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={kidSearchQuery}
            onChange={(e) => setKidSearchQuery(e.target.value)}
            placeholder={`Search in ${syncState.settings.kidName}'s approved videos...`}
            className="w-full bg-slate-950/90 border border-amber-300/40 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-inner"
          />
          {kidSearchQuery && (
            <button
              onClick={() => setKidSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Chips Bar */}
      <div className="bg-slate-950 px-3 py-2.5 border-b border-slate-800 overflow-x-auto flex items-center space-x-2 no-scrollbar select-none">
        <button
          onClick={() => setSelectedFilterKeyword('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center space-x-1 ${
            selectedFilterKeyword === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Approved ({allKidVideos.length})</span>
        </button>

        {/* Keywords Chips set by parent */}
        {activeKeywords.map((kw) => (
          <button
            key={kw}
            onClick={() => setSelectedFilterKeyword(kw)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all capitalize ${
              selectedFilterKeyword.toLowerCase() === kw.toLowerCase()
                ? 'bg-red-500 text-white shadow-md scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📺 {kw}
          </button>
        ))}

        {syncState.uploadedVideos.length > 0 && (
          <button
            onClick={() => setSelectedFilterKeyword('uploads')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedFilterKeyword === 'uploads'
                ? 'bg-sky-500 text-white shadow-md scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📂 Mom & Dad Uploads ({syncState.uploadedVideos.length})
          </button>
        )}
      </div>

      {/* Kid Feed Content View */}
      <div className="p-3 sm:p-5 flex-1 overflow-y-auto">
        
        {filteredVideos.length === 0 ? (
          <div className="py-12 px-4 text-center bg-slate-950/80 rounded-3xl border-2 border-dashed border-slate-800 max-w-sm mx-auto my-6 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
              <Smile className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-base text-amber-300">
              No videos in this list yet!
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask Mom or Dad to search for your favorite cartoons like <strong className="text-amber-200">"Tom and Jerry"</strong> or <strong className="text-amber-200">"Bugs Bunny Show"</strong> in the Parent App!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => onPlayVideo(video)}
                className="bg-slate-950 border-2 border-slate-800 hover:border-amber-400 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all transform hover:-translate-y-1 cursor-pointer group flex flex-col justify-between"
              >
                {/* Big Kid-Friendly Video Thumbnail */}
                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition border-2 border-white">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 bg-slate-950/90 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-lg border border-slate-700">
                    {video.duration}
                  </div>

                  {/* Upload/Matched Tag */}
                  {video.isParentUpload ? (
                    <div className="absolute top-2.5 left-2.5 bg-sky-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow uppercase tracking-wider">
                      From Mom & Dad
                    </div>
                  ) : video.keywordMatched ? (
                    <div className="absolute top-2.5 left-2.5 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow uppercase tracking-wider">
                      {video.keywordMatched}
                    </div>
                  ) : null}
                </div>

                {/* Card Footer Info */}
                <div className="p-3.5 bg-slate-950 flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-100 group-hover:text-amber-300 leading-snug line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {video.channelTitle}
                    </p>
                  </div>

                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
