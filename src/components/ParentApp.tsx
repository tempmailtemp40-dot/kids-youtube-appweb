import React, { useState } from 'react';
import { SyncState, Video, Keyword } from '../types';
import { storageService } from '../services/storageService';
import { CATALOG_VIDEOS } from '../data/sampleCatalog';
import {
  Search,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Sliders,
  Tv,
  Film,
  Tag,
  Eye,
  Check,
  Lock,
  Unlock,
  Clock,
  History,
  AlertCircle,
  FileVideo,
  ExternalLink,
} from 'lucide-react';

interface ParentAppProps {
  syncState: SyncState;
  onSelectVideoForPreview: (video: Video) => void;
  isUnlocked: boolean;
  setIsUnlocked: (unlocked: boolean) => void;
}

export const ParentApp: React.FC<ParentAppProps> = ({
  syncState,
  onSelectVideoForPreview,
  isUnlocked,
  setIsUnlocked,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'keywords' | 'upload' | 'preview' | 'settings'>('search');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('tom and jerry');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Keyword Add State
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // PIN Input state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Perform search
  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim().toLowerCase();
    if (!q) return;

    setIsSearching(true);
    setSearchMessage(null);

    // 1. First search local catalog
    const localMatches = CATALOG_VIDEOS.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q)) ||
        (v.keywordMatched && v.keywordMatched.toLowerCase().includes(q))
    );

    try {
      // 2. Call backend Gemini search endpoint to generate extra fresh videos if needed
      const response = await fetch('/api/gemini/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await response.json();

      let combined: Video[] = [...localMatches];
      if (data.success && data.videos) {
        // Merge Gemini results avoiding duplicates
        data.videos.forEach((gv: Video) => {
          if (!combined.some((c) => c.title.toLowerCase() === gv.title.toLowerCase())) {
            combined.push(gv);
          }
        });
      }

      setSearchResults(combined);
      setSearchMessage(`Found ${combined.length} videos matching "${q}"`);
    } catch (err) {
      console.error('Error during search fetch', err);
      setSearchResults(localMatches);
      setSearchMessage(`Displaying ${localMatches.length} catalog results for "${q}"`);
    } finally {
      setIsSearching(false);
    }
  };

  // Quick initial search on mount
  React.useEffect(() => {
    handleSearch('tom and jerry');
  }, []);

  // Add keyword helper
  const handleAddKeyword = (text: string) => {
    if (!text.trim()) return;
    storageService.addKeyword(text.trim());
    setNewKeywordInput('');
  };

  // Manual video add
  const handleAddManualVideo = (video: Video) => {
    storageService.addManualVideo(video);
  };

  // Remove manual video
  const handleRemoveManualVideo = (id: string) => {
    storageService.removeManualVideo(id);
  };

  // Local device file upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileObject(file);
      if (!uploadTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setUploadTitle(cleanName);
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    let finalVideoUrl = customVideoUrl.trim();
    if (fileObject) {
      finalVideoUrl = URL.createObjectURL(fileObject);
    }

    if (!finalVideoUrl) {
      alert('Please select a video file from your device or enter a video URL.');
      return;
    }

    const uploadedVideo: Video = {
      id: `up-${Date.now()}`,
      title: uploadTitle.trim(),
      description: uploadDesc.trim() || 'Uploaded by parent from local device.',
      channelTitle: `Parent (${syncState.settings.kidName}'s Mom/Dad)`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&auto=format&fit=crop&q=80',
      videoUrl: finalVideoUrl,
      duration: '03:45',
      views: 'Parent Direct Upload',
      publishedAt: 'Just now',
      tags: ['parent-upload', 'family'],
      isParentUpload: true,
      addedAt: new Date().toISOString(),
    };

    storageService.addUploadedVideo(uploadedVideo);
    setUploadTitle('');
    setUploadDesc('');
    setCustomVideoUrl('');
    setFileObject(null);
    setUploadSuccessMsg('Video uploaded & pinned to Kid Feed successfully!');
    setTimeout(() => setUploadSuccessMsg(null), 4000);
  };

  // PIN Unlock Verification
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === syncState.settings.pin) {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  // If PIN is enabled and parent app is locked
  if (syncState.settings.pinEnabled && !isUnlocked) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-zinc-950 text-white min-h-[500px]">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center mb-4 text-red-500 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-1">Parent App Locked</h2>
        <p className="text-xs text-zinc-400 mb-6 text-center max-w-xs">
          Enter 4-digit Parent PIN code to access feed curation & keywords.
        </p>

        <form onSubmit={handleUnlockPin} className="w-full max-w-xs flex flex-col items-center gap-3">
          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
            className="w-36 text-center text-2xl font-mono tracking-widest bg-zinc-900 border border-zinc-700 rounded-xl py-3 text-white focus:outline-none focus:border-red-500 shadow"
            autoFocus
          />
          {pinError && (
            <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Incorrect PIN. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow"
          >
            Unlock Parent Controls
          </button>
        </form>
      </div>
    );
  }

  const kidFeedVideos = storageService.getKidFeedVideos(syncState, searchResults);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100 min-h-full">
      
      {/* Top Parent App Banner & Navigation Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white leading-none">
                Parent Control App
              </h1>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Curating feed for <strong className="text-amber-400">{syncState.settings.kidName}</strong> ({syncState.settings.kidAvatar})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs bg-red-950 text-red-300 border border-red-800 px-2.5 py-1 rounded-full font-semibold flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{kidFeedVideos.length} Videos in Kid Feed</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'search'
                ? 'bg-red-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search & Add</span>
          </button>

          <button
            onClick={() => setActiveTab('keywords')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'keywords'
                ? 'bg-red-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Keywords ({syncState.keywords.filter((k) => k.enabled).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-red-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload ({syncState.uploadedVideos.length + syncState.manuallyAddedVideos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'preview'
                ? 'bg-red-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Kid Feed Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`col-span-2 sm:col-span-1 py-2 px-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'settings'
                ? 'bg-red-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        
        {/* TAB 1: SEARCH & CURATE */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            
            {/* Search Bar Input */}
            <div className="bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-800 space-y-3">
              <label className="text-xs font-semibold text-zinc-300 block">
                Parent YouTube Search & Keyword Curation Bar:
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cartoons or topics (e.g. tom and jerry, bugs bunny show, peppa pig)..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition flex items-center space-x-1.5 shrink-0 shadow"
                >
                  {isSearching ? (
                    <span>Searching...</span>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-zinc-500 text-[11px] font-medium">Quick Search:</span>
                {['tom and jerry', 'bugs bunny show', 'peppa pig', 'dinosaur adventures', 'math for kids'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      handleSearch(tag);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-700/60 transition text-[11px]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              {/* Add Search Query as Active Keyword Action */}
              {searchQuery.trim() && (
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-zinc-400">Want all videos about </span>
                    <strong className="text-amber-300 font-mono">"{searchQuery}"</strong>
                    <span className="text-zinc-400"> to show in Kid's Feed?</span>
                  </div>
                  {syncState.keywords.some((k) => k.text.toLowerCase() === searchQuery.trim().toLowerCase()) ? (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                      <Check className="w-3.5 h-3.5" />
                      <span>Keyword Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddKeyword(searchQuery)}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-3 py-1.5 rounded-lg transition shadow flex items-center space-x-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Keyword "{searchQuery}"</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Status Message */}
            {searchMessage && (
              <p className="text-xs text-zinc-400 font-medium px-1 flex items-center justify-between">
                <span>{searchMessage}</span>
                <span className="text-zinc-500 text-[11px]">Click "+ Add to Kid Feed" to select individual videos</span>
              </p>
            )}

            {/* Search Results Feed Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.map((video) => {
                const isManuallyInFeed = syncState.manuallyAddedVideos.some((v) => v.id === video.id || v.title === video.title);
                const isKeywordMatched = syncState.keywords.some(
                  (k) =>
                    k.enabled &&
                    (video.title.toLowerCase().includes(k.text.toLowerCase()) ||
                      video.description.toLowerCase().includes(k.text.toLowerCase()) ||
                      video.tags.some((t) => t.toLowerCase().includes(k.text.toLowerCase())))
                );
                const isInKidFeed = isManuallyInFeed || isKeywordMatched;

                return (
                  <div
                    key={video.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col hover:border-zinc-700 transition shadow-sm group"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {video.duration}
                      </div>
                      
                      {isInKidFeed && (
                        <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Kid Feed</span>
                        </div>
                      )}
                    </div>

                    {/* Info Body */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-2 leading-snug">
                          {video.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-1 flex items-center space-x-1">
                          <span>{video.channelTitle}</span>
                          <span>•</span>
                          <span>{video.views}</span>
                        </p>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onSelectVideoForPreview(video)}
                          className="text-[11px] text-zinc-400 hover:text-white underline flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        {isManuallyInFeed ? (
                          <button
                            onClick={() => handleRemoveManualVideo(video.id)}
                            className="bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-emerald-400 border border-zinc-700 text-xs font-semibold px-2.5 py-1 rounded-lg transition flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Added (Remove)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddManualVideo(video)}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Video to Kid Feed</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: KEYWORDS MANAGER */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            
            {/* Add Keyword Box */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="font-bold text-sm text-white">Curated Feed Keywords</h2>
                  <p className="text-xs text-zinc-400">
                    Add keywords (e.g., <strong className="text-amber-300">tom and jerry</strong>, <strong className="text-amber-300">bugs bunny show</strong>). The kid app automatically populates videos matching these terms!
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddKeyword(newKeywordInput);
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  placeholder="Enter keyword e.g. tom and jerry, bugs bunny show, peppa pig..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 shadow-inner"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-sm transition shadow flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Keyword</span>
                </button>
              </form>
            </div>

            {/* Keyword Chips List */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center justify-between">
                <span>Active Feed Keywords ({syncState.keywords.length})</span>
                <span className="text-zinc-500 text-[11px]">Toggle on/off or delete keywords</span>
              </h3>

              {syncState.keywords.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No active keywords yet. Add terms like "tom and jerry" or "bugs bunny show" above!
                </div>
              ) : (
                <div className="space-y-2">
                  {syncState.keywords.map((keyword) => {
                    // Count videos in catalog matching this keyword
                    const matchCount = CATALOG_VIDEOS.filter((v) =>
                      v.title.toLowerCase().includes(keyword.text.toLowerCase()) ||
                      v.description.toLowerCase().includes(keyword.text.toLowerCase()) ||
                      v.tags.some((t) => t.toLowerCase().includes(keyword.text.toLowerCase()))
                    ).length;

                    return (
                      <div
                        key={keyword.id}
                        className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                          keyword.enabled
                            ? 'bg-zinc-950 border-zinc-800 text-white'
                            : 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => storageService.toggleKeyword(keyword.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                              keyword.enabled
                                ? 'bg-amber-500 border-amber-400 text-zinc-950'
                                : 'bg-zinc-800 border-zinc-700 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <div>
                            <span className="font-bold text-sm tracking-wide text-amber-300">
                              "{keyword.text}"
                            </span>
                            <span className="text-[11px] text-zinc-400 ml-2">
                              (~{matchCount > 0 ? matchCount : 2}+ videos generated)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => storageService.deleteKeyword(keyword.id)}
                          className="p-1.5 hover:bg-red-950 hover:text-red-400 text-zinc-500 rounded-lg transition"
                          title="Delete keyword"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: UPLOAD & MANUAL VIDEOS */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            
            {/* Upload Box */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-sky-400" />
                <div>
                  <h2 className="font-bold text-sm text-white">Upload Video from Parent Device</h2>
                  <p className="text-xs text-zinc-400">
                    Select a local video file (MP4, WEBM) from your phone/computer or paste a video link to pin directly to the Kid App feed.
                  </p>
                </div>
              </div>

              {uploadSuccessMsg && (
                <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl flex items-center space-x-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-3 pt-1">
                {/* Device File Input */}
                <div className="border-2 border-dashed border-zinc-700 hover:border-sky-500 bg-zinc-950 p-4 rounded-xl text-center transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileVideo className="w-8 h-8 text-sky-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-zinc-200">
                    {fileObject ? fileObject.name : 'Click or Drag video file from device'}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">MP4, WEBM, MOV supported</p>
                </div>

                {/* Video Title & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Family Trip to the Zoo"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      OR Video/YouTube URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={customVideoUrl}
                      onChange={(e) => setCustomVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Description / Note for Kid
                  </label>
                  <input
                    type="text"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="e.g. Special video uploaded by Mom & Dad!"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pin Video to Kid App Feed</span>
                </button>
              </form>
            </div>

            {/* List of Uploads & Manually Selected Videos */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-300 mb-3">
                Manually Pinned Videos & Device Uploads ({syncState.uploadedVideos.length + syncState.manuallyAddedVideos.length})
              </h3>

              {syncState.uploadedVideos.length === 0 && syncState.manuallyAddedVideos.length === 0 ? (
                <p className="text-center py-6 text-zinc-500 text-xs">
                  No uploaded or manually pinned videos yet. Search videos or upload a file above!
                </p>
              ) : (
                <div className="space-y-2">
                  {syncState.uploadedVideos.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-950 p-2.5 rounded-xl border border-sky-900/60 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="bg-sky-900 text-sky-300 text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0">
                          UPLOAD
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-100 truncate">{item.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{item.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => storageService.removeUploadedVideo(item.id)}
                        className="p-1 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {syncState.manuallyAddedVideos.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="bg-red-900/80 text-red-300 text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0">
                          SELECTED
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-100 truncate">{item.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{item.channelTitle}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => storageService.removeManualVideo(item.id)}
                        className="p-1 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: KID FEED LIVE PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-3">
            <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-xs text-white flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Kid App Feed Live Preview ({kidFeedVideos.length} videos)</span>
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  This is exactly what {syncState.settings.kidName} sees right now based on active keywords & manual uploads.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {kidFeedVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onSelectVideoForPreview(video)}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/60 transition cursor-pointer group p-2.5 flex items-center space-x-3"
                >
                  <div className="w-28 aspect-video bg-zinc-950 rounded-xl overflow-hidden relative shrink-0">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 font-mono rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-zinc-100 group-hover:text-amber-300 truncate">
                      {video.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {video.channelTitle}
                    </p>
                    {video.keywordMatched && (
                      <span className="inline-block text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded font-mono mt-1">
                        Matched: {video.keywordMatched}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & WATCH HISTORY */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            
            {/* PIN Lock Settings */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <h2 className="font-bold text-xs text-white flex items-center space-x-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span>Parent Security PIN Protection</span>
              </h2>

              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-zinc-200">Require PIN to open Parent App</p>
                  <p className="text-[11px] text-zinc-400">Prevents kid from modifying keywords or adding videos</p>
                </div>
                <button
                  onClick={() =>
                    storageService.updateSettings({
                      pinEnabled: !syncState.settings.pinEnabled,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    syncState.settings.pinEnabled ? 'bg-red-600' : 'bg-zinc-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      syncState.settings.pinEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              {syncState.settings.pinEnabled && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-400">Current PIN:</span>
                  <input
                    type="text"
                    maxLength={4}
                    value={syncState.settings.pin}
                    onChange={(e) => storageService.updateSettings({ pin: e.target.value })}
                    className="w-20 bg-zinc-950 border border-zinc-700 text-center font-mono font-bold text-white py-1 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            {/* Kid Profile & Screen Time */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <h2 className="font-bold text-xs text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Kid Profile & Daily Screen Time Limit</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Child Name</label>
                  <input
                    type="text"
                    value={syncState.settings.kidName}
                    onChange={(e) => storageService.updateSettings({ kidName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Daily Time Limit (Minutes)</label>
                  <input
                    type="number"
                    value={syncState.settings.dailyTimeLimitMinutes}
                    onChange={(e) => storageService.updateSettings({ dailyTimeLimitMinutes: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Watch History Log */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <h2 className="font-bold text-xs text-white flex items-center space-x-2">
                <History className="w-4 h-4 text-sky-400" />
                <span>Watch History Log ({syncState.watchHistory.length} events)</span>
              </h2>

              {syncState.watchHistory.length === 0 ? (
                <p className="text-center py-4 text-zinc-500 text-xs">
                  No video activity recorded yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {syncState.watchHistory.map((item, idx) => (
                    <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs flex justify-between items-center">
                      <span className="font-medium text-zinc-200 truncate max-w-xs">{item.videoTitle}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(item.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
