import { M3UEntry, Channel, SeriesGroup, ParsedPlaylist, SeriesInfo } from '@/types/playlist';
import { classifyContent, parseSeriesInfo } from './categoryClassifier';

export function parseM3U(content: string): M3UEntry[] {
  const lines = content.split('\n');
  const entries: M3UEntry[] = [];
  let currentEntry: Partial<M3UEntry> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      const durationMatch = line.match(/#EXTINF:(-?\d+)/);
      currentEntry.duration = durationMatch ? parseInt(durationMatch[1]) : -1;

      // Parse attributes with support for single and double quotes
      const tvgIdMatch = line.match(/tvg-id=["']([^"']*)["']/);
      const tvgNameMatch = line.match(/tvg-name=["']([^"']*)["']/);
      const tvgLogoMatch = line.match(/tvg-logo=["']([^"']*)["']/);
      const groupMatch = line.match(/group-title=["']([^"']*)["']/);

      if (tvgIdMatch) currentEntry.tvgId = tvgIdMatch[1];
      if (tvgNameMatch) currentEntry.tvgName = tvgNameMatch[1];
      if (tvgLogoMatch) currentEntry.tvgLogo = tvgLogoMatch[1];
      if (groupMatch) currentEntry.groupTitle = groupMatch[1];

      // Get channel name (after last comma)
      const nameMatch = line.match(/,(.+)$/);
      if (nameMatch) {
        let rawName = nameMatch[1].trim();
        // Check for attributes leaking into name (common in some playlists)
        // e.g. ",Name" tvg-logo="..."
        if (rawName.includes('="')) {
           // Try to find where the name ends and attribute begins
           // Heuristic: look for " tvg-" or other standard attributes
           const attrMatch = rawName.match(/\s+[a-z-]+="/);
           if (attrMatch && attrMatch.index) {
             rawName = rawName.substring(0, attrMatch.index).trim();
           }
        }
        currentEntry.name = rawName;
      }

    } else if (line && !line.startsWith('#') && currentEntry.name) {
      // This is the URL line
      currentEntry.url = line;
      entries.push(currentEntry as M3UEntry);
      currentEntry = {};
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
  const channels: Channel[] = [];
  const liveTV: Channel[] = [];
  const movies: Channel[] = [];
  const seriesMap = new Map<string, SeriesGroup>();
  const categoriesSet = new Set<string>();

  for (const entry of entries) {
    const type = classifyContent(entry.name, entry.groupTitle);
    const seriesInfo = type === 'series' ? parseSeriesInfo(entry.name) : undefined;
    
    if (entry.groupTitle) {
      categoriesSet.add(entry.groupTitle);
    }

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

    channels.push(channel);

    switch (type) {
      case 'live':
        liveTV.push(channel);
        break;
      case 'movie':
        movies.push(channel);
        break;
      case 'series':
        if (seriesInfo) {
          const seriesKey = seriesInfo.seriesName.toLowerCase();
          
          // Use an extended structure to track all posters
          let seriesData = seriesMap.get(seriesKey) as (SeriesGroup & { posters: Map<string, number> }) | undefined;

          if (!seriesData) {
            seriesData = {
              name: seriesInfo.seriesName,
              poster: entry.tvgLogo,
              group: entry.groupTitle, // Capture the group/category
              seasons: [],
              posters: new Map<string, number>()
            };
            seriesMap.set(seriesKey, seriesData);
          }

          // Count poster occurrences
          if (entry.tvgLogo) {
            const currentCount = seriesData.posters.get(entry.tvgLogo) || 0;
            seriesData.posters.set(entry.tvgLogo, currentCount + 1);
          }

          let season = seriesData.seasons.find(s => s.number === seriesInfo.season);
          
          if (!season) {
            season = { number: seriesInfo.season, episodes: [] };
            seriesData.seasons.push(season);
          }

          season.episodes.push(channel);
          
          // Sort episodes by episode number
          season.episodes.sort((a, b) => 
            (a.seriesInfo?.episode || 0) - (b.seriesInfo?.episode || 0)
          );
        }
        break;
    }
  }

  // Sort seasons by number and pick most frequent poster
  const series = Array.from(seriesMap.values()).map(s => {
    // Logic to find most frequent poster
    let bestPoster = s.poster;
    let maxCount = 0;
    
    // Cast s to access the temporary posters map
    const seriesWithPosters = s as any;
    if (seriesWithPosters.posters) {
      for (const [poster, count] of seriesWithPosters.posters.entries()) {
        if (count > maxCount) {
          maxCount = count;
          bestPoster = poster;
        }
      }
    }

    // Clean up temporary property
    const { posters, ...cleanSeries } = seriesWithPosters;
    
    return {
      ...cleanSeries,
      poster: bestPoster,
      seasons: s.seasons.sort((a, b) => a.number - b.number),
    };
  });

  return {
    channels,
    liveTV,
    movies,
    series,
    categories: Array.from(categoriesSet).sort(),
    totalCount: channels.length,
  };
}

function resolveFetchUrl(url: string): string {
  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const targetIsHttp = /^http:\/\//i.test(url);
  if (isSecure && targetIsHttp) {
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  return url;
}

export async function fetchAndParseM3U(url: string): Promise<ParsedPlaylist> {
  const finalUrl = resolveFetchUrl(url);
  const response = await fetch(finalUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.status}`);
  }
  
  const content = await response.text();
  
  if (!content.includes('#EXTM3U')) {
    throw new Error('Invalid M3U format');
  }
  
  const entries = parseM3U(content);
  return processM3UEntries(entries);
}
