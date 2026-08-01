import React, { useState, useEffect } from 'react';
import { Video } from '../types';
import { X, Play, Pause, Volume2, VolumeX, Maximize, CheckCircle2, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { storageService } from '../services/storageService';

interface VideoPlayerModalProps {
  video: Video | null;
  onClose: () => void;
  approvedVideos: Video[];
  onSelectRelatedVideo: (video: Video) => void;
  isKidView?: boolean;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  approvedVideos,
  onSelectRelatedVideo,
  isKidView = false,
}) => {
  if (!video) return null;

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (video) {
      storageService.logWatchHistory({
        videoId: video.id,
        videoTitle: video.title,
        durationWatchedSeconds: 120,
      });
    }
  }, [video]);

  // Check if videoUrl is a YouTube embed or video link
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
      }
    }
    return null;
  };

  const embedUrl = getEmbedUrl(video.videoUrl);
  const otherApproved = approvedVideos.filter((v) => v.id !== video.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Modal Top Navigation */}
        <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isKidView ? (
              <span className="bg-amber-500 text-zinc-950 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>YouTube Kids Player</span>
              </span>
            ) : (
              <span className="bg-red-600 text-white font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Parent Approved Video</span>
              </span>
            )}
            <span className="text-zinc-400 text-xs hidden sm:inline">Safe Feed Sync Active</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
            title="Close video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="bg-black aspect-video w-full relative flex items-center justify-center overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              src={video.videoUrl}
              controls
              autoPlay
              className="w-full h-full max-h-[50vh] object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}
        </div>

        {/* Video Info & Approved Suggestions Scroll Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          
          {/* Main Video Info Header */}
          <div className="border-b border-zinc-800 pb-3">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {video.title}
              </h1>
              {video.isParentUpload && (
                <span className="shrink-0 bg-sky-950 text-sky-400 border border-sky-800 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                  Parent Device Upload
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-2">
              <span className="font-semibold text-zinc-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{video.channelTitle}</span>
              </span>
              <span>•</span>
              <span>{video.views}</span>
              <span>•</span>
              <span>{video.publishedAt}</span>
              {video.ageGroup && (
                <>
                  <span>•</span>
                  <span className="bg-zinc-800 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                    Age {video.ageGroup}
                  </span>
                </>
              )}
            </div>

            <p className="text-sm text-zinc-300 mt-2.5 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              {video.description}
            </p>

            {/* Keyword tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                {video.tags.map((tag, idx) => (
                  <span key={idx} className="bg-zinc-800/80 text-zinc-400 text-[11px] px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* More Approved Videos for Kids */}
          {otherApproved.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-200 mb-2.5 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Next Up from Mom & Dad's Approved List ({otherApproved.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {otherApproved.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectRelatedVideo(item)}
                    className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl p-2 cursor-pointer transition flex items-center space-x-3 group"
                  >
                    <div className="w-24 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0 relative">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 rounded font-mono">
                        {item.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {item.channelTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
