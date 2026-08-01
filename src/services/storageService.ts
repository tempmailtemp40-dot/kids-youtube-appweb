import { SyncState, Keyword, Video, ParentSettings, WatchHistoryItem } from '../types';
import { INITIAL_KEYWORDS, CATALOG_VIDEOS } from '../data/sampleCatalog';

const STORAGE_KEY = 'yt_kids_parent_sync_state_v1';
const CHANNEL_NAME = 'yt_kids_parent_channel';

const defaultSettings: ParentSettings = {
  pin: '1234',
  pinEnabled: false,
  dailyTimeLimitMinutes: 60,
  autoFilterEnabled: true,
  maxAge: 8,
  kidName: 'Alex',
  kidAvatar: '🦊',
};

const defaultSyncState: SyncState = {
  keywords: INITIAL_KEYWORDS,
  manuallyAddedVideos: [],
  uploadedVideos: [],
  settings: defaultSettings,
  watchHistory: [],
  lastUpdated: Date.now(),
};

class StorageService {
  private listeners: Array<(state: SyncState) => void> = [];
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_UPDATE') {
            const newState = this.loadFromStorage();
            this.notifyListeners(newState);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this browser environment', e);
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          const newState = this.loadFromStorage();
          this.notifyListeners(newState);
        }
      });
    }
  }

  public loadFromStorage(): SyncState {
    if (typeof window === 'undefined') return defaultSyncState;
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (!item) {
        this.saveToStorage(defaultSyncState);
        return defaultSyncState;
      }
      const parsed = JSON.parse(item) as SyncState;
      return {
        ...defaultSyncState,
        ...parsed,
        keywords: parsed.keywords || INITIAL_KEYWORDS,
        manuallyAddedVideos: parsed.manuallyAddedVideos || [],
        uploadedVideos: parsed.uploadedVideos || [],
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
        watchHistory: parsed.watchHistory || [],
      };
    } catch (e) {
      console.error('Error loading sync state from localStorage', e);
      return defaultSyncState;
    }
  }

  public saveToStorage(state: SyncState) {
    if (typeof window === 'undefined') return;
    try {
      const stateToSave = { ...state, lastUpdated: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'SYNC_UPDATE', timestamp: stateToSave.lastUpdated });
      }
      this.notifyListeners(stateToSave);
    } catch (e) {
      console.error('Error saving sync state to localStorage', e);
    }
  }

  public subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    // Send initial state immediately
    listener(this.loadFromStorage());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(state: SyncState) {
    this.listeners.forEach((listener) => listener(state));
  }

  // Operations
  public addKeyword(text: string): SyncState {
    const currentState = this.loadFromStorage();
    const cleanText = text.trim().toLowerCase();
    if (!cleanText) return currentState;

    const exists = currentState.keywords.some((k) => k.text.toLowerCase() === cleanText);
    if (exists) return currentState;

    const newKeyword: Keyword = {
      id: `kw-${Date.now()}`,
      text: cleanText,
      enabled: true,
      addedAt: new Date().toISOString(),
    };

    const newState = {
      ...currentState,
      keywords: [newKeyword, ...currentState.keywords],
    };
    this.saveToStorage(newState);
    return newState;
  }

  public toggleKeyword(id: string): SyncState {
    const currentState = this.loadFromStorage();
    const newState = {
      ...currentState,
      keywords: currentState.keywords.map((k) =>
        k.id === id ? { ...k, enabled: !k.enabled } : k
      ),
    };
    this.saveToStorage(newState);
    return newState;
  }

  public deleteKeyword(id: string): SyncState {
    const currentState = this.loadFromStorage();
    const newState = {
      ...currentState,
      keywords: currentState.keywords.filter((k) => k.id !== id),
    };
    this.saveToStorage(newState);
    return newState;
  }

  public addManualVideo(video: Video): SyncState {
    const currentState = this.loadFromStorage();
    const exists = currentState.manuallyAddedVideos.some((v) => v.id === video.id || (v.title === video.title && v.videoUrl === video.videoUrl));
    if (exists) return currentState;

    const videoToAdd: Video = {
      ...video,
      isManuallySelected: true,
      addedAt: new Date().toISOString(),
    };

    const newState = {
      ...currentState,
      manuallyAddedVideos: [videoToAdd, ...currentState.manuallyAddedVideos],
    };
    this.saveToStorage(newState);
    return newState;
  }

  public removeManualVideo(id: string): SyncState {
    const currentState = this.loadFromStorage();
    const newState = {
      ...currentState,
      manuallyAddedVideos: currentState.manuallyAddedVideos.filter((v) => v.id !== id),
    };
    this.saveToStorage(newState);
    return newState;
  }

  public addUploadedVideo(video: Video): SyncState {
    const currentState = this.loadFromStorage();
    const videoToAdd: Video = {
      ...video,
      isParentUpload: true,
      addedAt: new Date().toISOString(),
    };

    const newState = {
      ...currentState,
      uploadedVideos: [videoToAdd, ...currentState.uploadedVideos],
    };
    this.saveToStorage(newState);
    return newState;
  }

  public removeUploadedVideo(id: string): SyncState {
    const currentState = this.loadFromStorage();
    const newState = {
      ...currentState,
      uploadedVideos: currentState.uploadedVideos.filter((v) => v.id !== id),
    };
    this.saveToStorage(newState);
    return newState;
  }

  public updateSettings(settings: Partial<ParentSettings>): SyncState {
    const currentState = this.loadFromStorage();
    const newState = {
      ...currentState,
      settings: { ...currentState.settings, ...settings },
    };
    this.saveToStorage(newState);
    return newState;
  }

  public logWatchHistory(item: Omit<WatchHistoryItem, 'watchedAt'>): SyncState {
    const currentState = this.loadFromStorage();
    const newItem: WatchHistoryItem = {
      ...item,
      watchedAt: new Date().toISOString(),
    };
    const newState = {
      ...currentState,
      watchHistory: [newItem, ...currentState.watchHistory.slice(0, 49)],
    };
    this.saveToStorage(newState);
    return newState;
  }

  // Helper to compute Kid Feed dynamically
  public getKidFeedVideos(state: SyncState, searchExtraVideos: Video[] = []): Video[] {
    const activeKeywords = state.keywords.filter((k) => k.enabled).map((k) => k.text.toLowerCase());

    const resultList: Video[] = [];
    const addedIds = new Set<string>();

    // 1. First, include parent uploaded videos
    state.uploadedVideos.forEach((v) => {
      if (!addedIds.has(v.id)) {
        addedIds.add(v.id);
        resultList.push(v);
      }
    });

    // 2. Second, include manually selected videos
    state.manuallyAddedVideos.forEach((v) => {
      if (!addedIds.has(v.id)) {
        addedIds.add(v.id);
        resultList.push(v);
      }
    });

    // 3. Third, include catalog videos that match ANY active keyword
    const combinedPool = [...CATALOG_VIDEOS, ...searchExtraVideos];
    combinedPool.forEach((v) => {
      if (addedIds.has(v.id)) return;

      const titleLower = v.title.toLowerCase();
      const descLower = v.description.toLowerCase();
      const tagsLower = v.tags.map((t) => t.toLowerCase());
      const kwMatched = v.keywordMatched?.toLowerCase();

      const matchesKeyword = activeKeywords.some(
        (kw) =>
          titleLower.includes(kw) ||
          descLower.includes(kw) ||
          tagsLower.some((t) => t.includes(kw)) ||
          (kwMatched && kwMatched.includes(kw))
      );

      if (matchesKeyword) {
        addedIds.add(v.id);
        resultList.push(v);
      }
    });

    return resultList;
  }
}

export const storageService = new StorageService();
