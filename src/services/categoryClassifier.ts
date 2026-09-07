import { SeriesInfo } from '@/types/playlist';

const seriesKeywords = ['series', 'série', 'temporada', 'season', 'episode', 'episodio', 'episódio'];
const seriesPattern = /s\d{1,2}e\d{1,2}|temporada\s*\d|season\s*\d|episod/i;

const movieKeywords = ['filmes', 'movies', 'filme', 'movie', 'vod', 'cinema'];
const moviePattern = /\(\d{4}\)|\[\d{4}\]/;

const liveKeywords = ['ao vivo', 'live', '24h', '24 horas', 'canal', 'tv aberta', 'aberto'];

export function classifyContent(name: string, group?: string): 'live' | 'movie' | 'series' {
  const nameLower = name.toLowerCase();
  const groupLower = (group || '').toLowerCase();

  // Check for series
  if (
    seriesKeywords.some(k => nameLower.includes(k) || groupLower.includes(k)) ||
    seriesPattern.test(name)
  ) {
    return 'series';
  }

  // Check for movies
  if (
    movieKeywords.some(k => groupLower.includes(k)) ||
    moviePattern.test(name)
  ) {
    return 'movie';
  }

  // Default to live
  return 'live';
}

export function parseSeriesInfo(name: string): SeriesInfo | null {
  const patterns = [
    // Breaking Bad S01E02
    /(.+?)\s*[sS](\d{1,2})[eE](\d{1,3})\s*(?:-\s*(.+))?$/,
    // Serie Nome - Temporada 1 Episódio 5
    /(.+?)\s*(?:temporada|season)\s*(\d{1,2})\s*(?:episod[io]|ep\.?)\s*(\d{1,3})\s*(?:-\s*(.+))?$/i,
    // Serie Nome 1x03
    /(.+?)\s*(\d{1,2})x(\d{1,3})\s*(?:-\s*(.+))?$/,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        seriesName: match[1].trim(),
        season: parseInt(match[2]),
        episode: parseInt(match[3]),
        episodeTitle: match[4]?.trim(),
      };
    }
  }

  return null;
}

const adultKeywords = [
  'adult', 'adulto', 'xxx', '18+', '+18',
  'erotic', 'erótico', 'mature', 'maduro',
  'porn', 'hardcore', 'sex'
];

export function isAdultContent(name: string, group?: string): boolean {
  const nameLower = name.toLowerCase();
  const groupLower = (group || '').toLowerCase();

  return adultKeywords.some(keyword =>
    nameLower.includes(keyword) || groupLower.includes(keyword)
  );
}
