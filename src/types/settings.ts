export interface Settings {
  playlistUrl: string;
  epgUrl: string;
  parentalEnabled: boolean;
  parentalPin: string;
  lastUpdated: number | null;
}

export interface PlaylistInfo {
  channelsCount: number;
  seriesCount: number;
  moviesCount: number;
}

export const STORAGE_KEYS = {
  PLAYLIST_URL: 'streamplay_playlist_url',
  EPG_URL: 'streamplay_epg_url',
  PARENTAL_PIN: 'streamplay_parental_pin',
  PARENTAL_ENABLED: 'streamplay_parental_enabled',
  FAVORITES: 'streamplay_favorites',
  WATCH_HISTORY: 'streamplay_watch_history',
  WATCH_PROGRESS: 'streamplay_watch_progress',
  LAST_UPDATED: 'streamplay_last_updated',
  PLAYLIST_CACHE: 'streamplay_playlist_cache',
} as const;

export const DEFAULT_PIN = '0000';
