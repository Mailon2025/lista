import { SeriesInfo } from '@/types/playlist';

const seriesGroupKeywords = ['series', 'série', 'séries', 'temporada', 'season', 'episode', 'episodio', 'episódio', 'seriados'];
const movieGroupKeywords = ['filmes', 'movies', 'filme', 'movie', 'vod', 'cinema', 'lancamento', 'lançamentos', '4k'];
const liveGroupKeywords = ['ao vivo', 'live', '24h', '24 horas', 'canal', 'tv aberta', 'aberto', 'esporte', 'esportes', 'noticias', 'notícias', 'radio', 'rádio'];

function includesAny(haystack: string, needles: string[]): boolean {
  for (let i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

const seriesNamePattern = /s\d{1,2}[eE]\d{1,2}|\d{1,2}x\d{1,3}/;
const movieNamePattern = /\(\d{4}\)|\[\d{4}\]/;

export function classifyContent(name: string, group?: string): 'live' | 'movie' | 'series' {
  // 1) Classificação por grupo (95% dos casos) — mais barato
  if (group && group.length) {
    const g = group.length > 80 ? group.toLowerCase() : group.toLocaleLowerCase();
    if (includesAny(g, seriesGroupKeywords)) return 'series';
    if (includesAny(g, movieGroupKeywords)) return 'movie';
    if (includesAny(g, liveGroupKeywords)) return 'live';
  }

  // 2) Fallback por nome (regex caro, só roda se não classificou por grupo)
  const n = name.toLocaleLowerCase();
  if (seriesNamePattern.test(name) || includesAny(n, seriesGroupKeywords)) return 'series';
  if (movieNamePattern.test(name) || includesAny(n, movieGroupKeywords)) return 'movie';
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
