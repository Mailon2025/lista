import { M3UEntry, Channel, SeriesGroup, ParsedPlaylist, SeriesInfo } from '@/types/playlist';
import { classifyContent, parseSeriesInfo } from './categoryClassifier';

function parseAttrFast(line: string, key: string): string | undefined {
  const marker = `${key}=`;
  let i = line.indexOf(marker);
  if (i === -1) return undefined;
  i += marker.length;
  if (i >= line.length) return undefined;
  const quote = line[i];
  if (quote === '"' || quote === "'") {
    const end = line.indexOf(quote, i + 1);
    if (end === -1) return undefined;
    return line.substring(i + 1, end);
  }
  const space = line.indexOf(' ', i);
  return space === -1 ? line.substring(i) : line.substring(i, space);
}

function parseExtInfDuration(line: string): number {
  // substring between '#EXTINF:' and next non-digit-char (can be sign/space/comma)
  const prefixLen = 8; // '#EXTINF:'.length
  let j = prefixLen;
  if (line[j] === '-' || line[j] === '+') j++;
  let k = j;
  while (k < line.length && line[k] >= '0' && line[k] <= '9') k++;
  if (k === j) return -1;
  const n = parseInt(line.substring(j, k), 10);
  return Number.isFinite(n) ? n : -1;
}

function parseChannelName(line: string): string | undefined {
  const comma = line.lastIndexOf(',');
  if (comma === -1) return undefined;
  let raw = line.substring(comma + 1).trim();
  if (!raw) return undefined;
  const attrIdx = raw.indexOf('="');
  if (attrIdx !== -1) {
    const spaceIdx = raw.lastIndexOf(' ', attrIdx);
    raw = (spaceIdx === -1 ? raw.substring(0, attrIdx) : raw.substring(0, spaceIdx)).trim();
  }
  return raw || undefined;
}

export function parseM3U(content: string): M3UEntry[] {
  const entries: M3UEntry[] = [];
  const chunkSize = 20000; // libera UI a cada N linhas
  let currentEntry: Partial<M3UEntry> = {};
  let linesRead = 0;
  let idx = 0;
  const len = content.length;

  while (idx <= len) {
    let nl = content.indexOf('\n', idx);
    if (nl === -1) nl = len;
    let rawLine = content.substring(idx, nl);
    idx = nl + 1;
    if (rawLine.charCodeAt(rawLine.length - 1) === 13) rawLine = rawLine.slice(0, -1);
    const line = rawLine.trim();
    linesRead++;

    if (line.length === 0) continue;

    if (line.startsWith('#EXTINF:')) {
      currentEntry.duration = parseExtInfDuration(line);
      const tvgId = parseAttrFast(line, 'tvg-id');
      const tvgName = parseAttrFast(line, 'tvg-name');
      const tvgLogo = parseAttrFast(line, 'tvg-logo');
      const groupTitle = parseAttrFast(line, 'group-title');
      if (tvgId !== undefined) currentEntry.tvgId = tvgId;
      if (tvgName !== undefined) currentEntry.tvgName = tvgName;
      if (tvgLogo !== undefined) currentEntry.tvgLogo = tvgLogo;
      if (groupTitle !== undefined) currentEntry.groupTitle = groupTitle;
      const name = parseChannelName(line);
      if (name) currentEntry.name = name;
    } else if (line.charCodeAt(0) !== 35 /* '#' */ && currentEntry.name) {
      currentEntry.url = line;
      entries.push(currentEntry as M3UEntry);
      currentEntry = {};
    }

    if (linesRead % chunkSize === 0) {
      // apenas yield para atualizações futuras; parse continua sincrono por enquanto
    }
  }

  return entries;
}

function generateId(entry: M3UEntry): string {
  const base = `${entry.name}-${entry.groupTitle || 'default'}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function processM3UEntries(entries: M3UEntry[]): ParsedPlaylist {
  const total = entries.length;
  const channels: Channel[] = new Array(total);
  const liveTV: Channel[] = [];
  const movies: Channel[] = [];
  const seriesMap = new Map<string, SeriesGroup & {
    seasonsMap: Map<number, Channel[]>;
    posterFirst?: string;
  }>();
  const categoriesSet = new Set<string>();

  for (let i = 0; i < total; i++) {
    const entry = entries[i];
    if (!entry.name || !entry.url) continue;

    const type = classifyContent(entry.name, entry.groupTitle);
    let seriesInfo: SeriesInfo | undefined;
    if (type === 'series') seriesInfo = parseSeriesInfo(entry.name) || undefined;

    if (entry.groupTitle) categoriesSet.add(entry.groupTitle);

    const channel: Channel = {
      id: generateId(entry),
      name: entry.name,
      url: entry.url,
      logo: entry.tvgLogo,
      group: entry.groupTitle,
      tvgId: entry.tvgId,
      tvgName: entry.tvgName,
      type,
      seriesInfo,
    };
    channels[i] = channel;

    if (type === 'live') { liveTV.push(channel); continue; }
    if (type === 'movie') { movies.push(channel); continue; }

    // Series
    if (!seriesInfo) { liveTV.push(channel); continue; }
    const seriesKey = seriesInfo.seriesName.toLocaleLowerCase();
    let sd = seriesMap.get(seriesKey);
    if (!sd) {
      sd = {
        name: seriesInfo.seriesName,
        poster: entry.tvgLogo,
        posterFirst: entry.tvgLogo,
        group: entry.groupTitle,
        seasons: [],
        seasonsMap: new Map(),
      };
      seriesMap.set(seriesKey, sd);
    }
    let sn = sd.seasonsMap.get(seriesInfo.season);
    if (!sn) { sn = []; sd.seasonsMap.set(seriesInfo.season, sn); }
    sn.push(channel);
    if (!sd.poster && entry.tvgLogo) sd.poster = entry.tvgLogo;
  }

  // Materialize seasons from seasonsMap (episódios já quase ordenados por chegada; sort barato se poucos)
  const series: SeriesGroup[] = [];
  for (const sd of seriesMap.values()) {
    const arr: { number: number; episodes: Channel[] }[] = [];
    for (const [n, ep] of sd.seasonsMap.entries()) {
      ep.sort((a, b) => (a.seriesInfo?.episode || 0) - (b.seriesInfo?.episode || 0));
      arr.push({ number: n, episodes: ep });
    }
    arr.sort((a, b) => a.number - b.number);
    series.push({
      name: sd.name,
      poster: sd.poster || sd.posterFirst || undefined,
      group: sd.group,
      seasons: arr,
    });
  }

  // Compacta channels
  let outChannels = channels;
  for (let i = 0; i < total; i++) {
    if (!channels[i]) { outChannels = channels.filter(Boolean); break; }
  }

  return {
    channels: outChannels,
    liveTV,
    movies,
    series,
    categories: Array.from(categoriesSet).sort(),
    totalCount: outChannels.length,
  };
}

// -------- Cache offline por URL --------
const CACHE_PREFIX = 'm3u-cache-v1:';
const CACHE_MAX_BYTES = 150 * 1024 * 1024; // 150MB (cabe 2 listas de 76MB)

function hashStr(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function currentCacheBytes(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        total += (localStorage.getItem(k)?.length || 0) * 2; // UTF-16 aprox
      }
    }
    return total;
  } catch { return 0; }
}

function evictCacheIfNeeded(additionalBytes: number) {
  try {
    while (currentCacheBytes() + additionalBytes > CACHE_MAX_BYTES) {
      let oldestK: string | null = null;
      let oldestT = Infinity;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(CACHE_PREFIX)) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        let t = 0;
        try { t = JSON.parse(raw).ts || 0; } catch { t = 0; }
        if (t < oldestT) { oldestT = t; oldestK = k; }
      }
      if (!oldestK) break;
      localStorage.removeItem(oldestK);
    }
  } catch {}
}

export function getCachedPlaylist(url: string): ParsedPlaylist | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + hashStr(url));
    if (!raw) return null;
    const obj = JSON.parse(raw) as { ts: number; url: string; data: ParsedPlaylist };
    if (obj.url !== url) return null;
    return obj.data;
  } catch { return null; }
}

export function setCachedPlaylist(url: string, data: ParsedPlaylist) {
  try {
    const payload = JSON.stringify({ ts: Date.now(), url, data });
    evictCacheIfNeeded(payload.length * 2);
    localStorage.setItem(CACHE_PREFIX + hashStr(url), payload);
  } catch {}
}

const CORS_PROXIES = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.github.io/?${encodeURIComponent(u)}`,
];

function needsProxy(url: string): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol !== 'https:') return false;
  return /^http:\/\//i.test(url);
}

async function fetchWithFallback(url: string): Promise<Response> {
  if (!needsProxy(url)) {
    const res = await fetch(url);
    if (res.ok) return res;
  }

  const attempts: Array<PromiseSettledResult<Response>> = [];
  for (const wrap of CORS_PROXIES) {
    try {
      const proxied = wrap(url);
      const res = await fetch(proxied);
      if (res.ok && res.status !== 403 && res.status !== 429) return res;
      attempts.push({ status: 'rejected', reason: new Error(`HTTP ${res.status}`) });
    } catch (e) {
      attempts.push({ status: 'rejected', reason: e as Error });
    }
  }

  throw new Error(
    `Nenhum proxy CORS respondeu. Tente novamente ou use uma URL HTTPS.`
  );
}

export async function fetchAndParseM3U(url: string): Promise<ParsedPlaylist> {
  const response = await fetchWithFallback(url);
  
  const content = await response.text();
  
  if (!content.includes('#EXTM3U')) {
    throw new Error('Invalid M3U format');
  }
  
  const entries = parseM3U(content);
  return processM3UEntries(entries);
}
