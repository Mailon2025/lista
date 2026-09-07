/**
 * Serviço de busca de posters para séries usando TMDB
 * 
 * TMDB oferece API gratuita com excelente cobertura de séries brasileiras/latinas
 * Rate limit: ~40 requests por 10 segundos (muito generoso)
 */

const CACHE_KEY = 'series_poster_cache_v3';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const FAILED_CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day para falhas

// API Key gratuita do TMDB - você pode criar a sua em https://www.themoviedb.org/settings/api
// Esta é uma key de exemplo/desenvolvimento
const TMDB_API_KEY = 'e055b8edcf31b5eef4c60902850a056a';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface CacheEntry {
  url: string | null;
  timestamp: number;
}

interface Cache {
  [key: string]: CacheEntry;
}

interface QueueItem {
  cleanName: string;
  originalName: string;
  resolve: (url: string | null) => void;
}

const queue: QueueItem[] = [];
let isProcessing = false;
const RATE_LIMIT_DELAY = 250; // 250ms entre requests

// ==================== CACHE ====================

function getCache(): Cache {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
}

function setCache(key: string, url: string | null) {
  try {
    const cache = getCache();
    cache[key] = {
      url,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

function getCached(cleanName: string): { found: boolean; url: string | null } {
  const cache = getCache();
  const cached = cache[cleanName];
  
  if (!cached) {
    return { found: false, url: null };
  }
  
  const age = Date.now() - cached.timestamp;
  const maxAge = cached.url ? CACHE_DURATION : FAILED_CACHE_DURATION;
  
  if (age < maxAge) {
    return { found: true, url: cached.url };
  }
  
  return { found: false, url: null };
}

// ==================== NAME CLEANING ====================

function cleanSeriesName(name: string): string {
  let cleaned = name
    // Remove atributos M3U vazados
    .replace(/"\s*tvg-logo=".*$/i, '')
    .replace(/\s*tvg-\w+="[^"]*"/gi, '')
    // Remove padrões de episódio (vários formatos)
    .replace(/\s*S\d{1,2}\s*E\d{1,3}/gi, '')
    .replace(/\s*S\d{1,2}/gi, '')
    .replace(/\s*\d{1,2}x\d{1,3}/gi, '')
    .replace(/\s*-?\s*T(?:emp)?(?:orada)?\s*\d+\s*-?\s*E(?:p)?(?:is[oó]dio)?\s*\d+/gi, '')
    .replace(/\s*-?\s*Temporada\s*\d+/gi, '')
    .replace(/\s*-?\s*Season\s*\d+/gi, '')
    .replace(/\s*E(?:p|pisode|pisódio|pisodio)?\s*\d+/gi, '')
    .replace(/\s*Cap[ií]tulo\s*\d+/gi, '')
    // Remove qualidade e tags
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\s*\((?:\d{4}|HD|4K|FHD)\)/g, '')
    .replace(/\s*(?:720p|1080p|4K|HD|FHD|UHD|HDTV|WEB-?DL|BluRay)/gi, '')
    .replace(/\s*(?:DUAL|DUB|LEG|DUBBED|LEGENDADO)/gi, '')
    // Remove separadores e limpa
    .replace(/\s*[-–—:]+\s*$/g, '')
    .replace(/[_\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove números soltos no final (geralmente episódio)
  cleaned = cleaned.replace(/\s+\d{1,3}$/, '').trim();
  
  return cleaned;
}

// ==================== TMDB API ====================

async function searchTMDB(query: string): Promise<string | null> {
  if (!query || query.length < 2) return null;
  
  try {
    // Busca em português primeiro
    const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
    
    const response = await fetch(url);
    
    if (response.status === 429) {
      // Rate limited - espera e tenta novamente
      await new Promise(r => setTimeout(r, 2000));
      return searchTMDB(query);
    }
    
    if (!response.ok) {
      console.warn(`TMDB API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Tenta encontrar match exato primeiro
      const exactMatch = data.results.find((r: any) => 
        r.name?.toLowerCase() === query.toLowerCase() ||
        r.original_name?.toLowerCase() === query.toLowerCase()
      );
      
      const result = exactMatch || data.results[0];
      
      if (result.poster_path) {
        return `${TMDB_IMAGE_BASE}${result.poster_path}`;
      }
    }
    
    // Se não achou em PT-BR, tenta em inglês
    const urlEN = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    const responseEN = await fetch(urlEN);
    
    if (responseEN.ok) {
      const dataEN = await responseEN.json();
      if (dataEN.results?.[0]?.poster_path) {
        return `${TMDB_IMAGE_BASE}${dataEN.results[0].poster_path}`;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error(`TMDB search error for "${query}":`, error);
    return null;
  }
}

// ==================== QUEUE PROCESSING ====================

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    
    try {
      const posterUrl = await searchTMDB(item.cleanName);
      
      // Cache o resultado (mesmo se null)
      setCache(item.cleanName, posterUrl);
      
      item.resolve(posterUrl);
      
    } catch (error) {
      console.error(`Error fetching poster for "${item.cleanName}":`, error);
      setCache(item.cleanName, null);
      item.resolve(null);
    }
    
    // Rate limiting
    if (queue.length > 0) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
    }
  }
  
  isProcessing = false;
}

// ==================== PUBLIC API ====================

/**
 * Busca o poster de uma série pelo nome
 * Retorna URL do poster ou null se não encontrar
 */
export function fetchSeriesPoster(seriesName: string): Promise<string | null> {
  const cleanName = cleanSeriesName(seriesName);
  
  if (!cleanName || cleanName.length < 2) {
    return Promise.resolve(null);
  }
  
  // Verifica cache primeiro
  const cached = getCached(cleanName);
  if (cached.found) {
    return Promise.resolve(cached.url);
  }
  
  // Adiciona à fila de processamento
  return new Promise((resolve) => {
    // Evita duplicatas na fila
    const exists = queue.some(q => q.cleanName === cleanName);
    if (exists) {
      // Espera o resultado do item existente
      const checkInterval = setInterval(() => {
        const result = getCached(cleanName);
        if (result.found) {
          clearInterval(checkInterval);
          resolve(result.url);
        }
      }, 500);
      
      // Timeout de segurança
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 30000);
      
      return;
    }
    
    queue.push({ cleanName, originalName: seriesName, resolve });
    processQueue();
  });
}

/**
 * Limpa o cache de posters
 */
export function clearPosterCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log('Poster cache cleared');
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats(): { total: number; withPoster: number; failed: number } {
  const cache = getCache();
  const entries = Object.values(cache);
  
  return {
    total: entries.length,
    withPoster: entries.filter(e => e.url !== null).length,
    failed: entries.filter(e => e.url === null).length,
  };
}

/**
 * Força atualização de um poster específico (ignora cache)
 */
export async function refreshSeriesPoster(seriesName: string): Promise<string | null> {
  const cleanName = cleanSeriesName(seriesName);
  if (!cleanName) return null;
  
  const posterUrl = await searchTMDB(cleanName);
  setCache(cleanName, posterUrl);
  
  return posterUrl;
}
