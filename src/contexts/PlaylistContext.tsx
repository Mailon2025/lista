import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ParsedPlaylist, Channel, SeriesGroup } from '@/types/playlist';
import { fetchAndParseM3U } from '@/services/m3uParser';
import { STORAGE_KEYS } from '@/types/settings';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface PlaylistContextType {
  playlist: ParsedPlaylist | null;
  isLoading: boolean;
  error: string | null;
  playlistUrl: string;
  loadPlaylist: (url: string) => Promise<void>;
  refreshPlaylist: () => Promise<void>;
  getChannelById: (id: string) => Channel | undefined;
  getSeriesByName: (name: string) => SeriesGroup | undefined;
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlist, setPlaylist] = useState<ParsedPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistUrl, setPlaylistUrl] = useLocalStorage<string>(STORAGE_KEYS.PLAYLIST_URL, '');
  const [, setLastUpdated] = useLocalStorage<number | null>(STORAGE_KEYS.LAST_UPDATED, null);

  const loadPlaylist = useCallback(async (url: string) => {
    if (!url) {
      setError('URL da playlist não fornecida');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsedPlaylist = await fetchAndParseM3U(url);
      setPlaylist(parsedPlaylist);
      setPlaylistUrl(url);
      setLastUpdated(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar playlist';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setPlaylistUrl, setLastUpdated]);

  const refreshPlaylist = useCallback(async () => {
    if (playlistUrl) {
      await loadPlaylist(playlistUrl);
    }
  }, [playlistUrl, loadPlaylist]);

  const getChannelById = useCallback((id: string) => {
    return playlist?.channels.find(c => c.id === id);
  }, [playlist]);

  const getSeriesByName = useCallback((name: string) => {
    return playlist?.series.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );
  }, [playlist]);

  // Auto-load playlist on mount if URL exists
  // Removed to allow manual connection
  /*
  useEffect(() => {
    if (playlistUrl && !playlist && !isLoading) {
      loadPlaylist(playlistUrl);
    }
  }, [playlistUrl, playlist, isLoading, loadPlaylist]);
  */

  return (
    <PlaylistContext.Provider
      value={{
        playlist,
        isLoading,
        error,
        playlistUrl,
        loadPlaylist,
        refreshPlaylist,
        getChannelById,
        getSeriesByName,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
