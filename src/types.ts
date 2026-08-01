export interface Video {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  views: string;
  publishedAt: string;
  tags: string[];
  ageGroup?: string;
  keywordMatched?: string;
  isParentUpload?: boolean;
  isManuallySelected?: boolean;
  addedAt: string;
  youtubeId?: string;
}

export interface Keyword {
  id: string;
  text: string;
  enabled: boolean;
  addedAt: string;
  videoCount?: number;
}

export interface ParentSettings {
  pin: string;
  pinEnabled: boolean;
  dailyTimeLimitMinutes: number;
  autoFilterEnabled: boolean;
  maxAge: number;
  kidName: string;
  kidAvatar: string;
}

export interface WatchHistoryItem {
  videoId: string;
  videoTitle: string;
  watchedAt: string;
  durationWatchedSeconds: number;
}

export interface SyncState {
  keywords: Keyword[];
  manuallyAddedVideos: Video[];
  uploadedVideos: Video[];
  settings: ParentSettings;
  watchHistory: WatchHistoryItem[];
  lastUpdated: number;
}

export type ViewMode = 'parent' | 'kid' | 'dual';
