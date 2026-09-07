export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  tvgName?: string;
  type: 'live' | 'movie' | 'series';
  seriesInfo?: SeriesInfo;
}

export interface SeriesInfo {
  seriesName: string;
  season: number;
  episode: number;
  episodeTitle?: string;
}

export interface SeriesGroup {
  name: string;
  poster?: string;
  group?: string;
  seasons: SeasonGroup[];
}

export interface SeasonGroup {
  number: number;
  episodes: Channel[];
}

export interface ParsedPlaylist {
  channels: Channel[];
  liveTV: Channel[];
  movies: Channel[];
  series: SeriesGroup[];
  categories: string[];
  totalCount: number;
}

export interface M3UEntry {
  duration: number;
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
}

export interface WatchHistory {
  id: string;
  name: string;
  logo?: string;
  type: 'live' | 'movie' | 'series';
  timestamp: number;
  progress?: number;
  url: string;
  group?: string;
}

export interface WatchProgress {
  [channelId: string]: {
    progress: number;
    duration: number;
    lastWatched: number;
  };
}
