import React, { createContext, useContext, useCallback } from 'react';
import { WatchHistory, Channel } from '@/types/playlist';
import { STORAGE_KEYS } from '@/types/settings';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface FavoritesContextType {
  favorites: string[];
  watchHistory: WatchHistory[];
  isFavorite: (channelId: string) => boolean;
  toggleFavorite: (channel: Channel) => void;
  addToHistory: (channel: Channel) => void;
  clearHistory: () => void;
  getFavoriteChannels: (allChannels: Channel[]) => Channel[];
  getRecentChannels: (allChannels: Channel[]) => Channel[];
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const MAX_HISTORY_ITEMS = 10;

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<string[]>(STORAGE_KEYS.FAVORITES, []);
  const [watchHistory, setWatchHistory] = useLocalStorage<WatchHistory[]>(
    STORAGE_KEYS.WATCH_HISTORY,
    []
  );

  const isFavorite = useCallback((channelId: string) => {
    return favorites.includes(channelId);
  }, [favorites]);

  const toggleFavorite = useCallback((channel: Channel) => {
    setFavorites(prev => {
      if (prev.includes(channel.id)) {
        return prev.filter(id => id !== channel.id);
      }
      return [...prev, channel.id];
    });
  }, [setFavorites]);

  const addToHistory = useCallback((channel: Channel) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(h => h.id !== channel.id);
      const newEntry: WatchHistory = {
        id: channel.id,
        name: channel.name,
        logo: channel.logo,
        type: channel.type,
        timestamp: Date.now(),
        url: channel.url,
        group: channel.group,
      };
      return [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, [setWatchHistory]);

  const clearHistory = useCallback(() => {
    setWatchHistory([]);
  }, [setWatchHistory]);

  const getFavoriteChannels = useCallback((allChannels: Channel[]) => {
    return allChannels.filter(c => favorites.includes(c.id));
  }, [favorites]);

  const getRecentChannels = useCallback((allChannels: Channel[]) => {
    return watchHistory
      .map(h => allChannels.find(c => c.id === h.id))
      .filter((c): c is Channel => c !== undefined);
  }, [watchHistory]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        watchHistory,
        isFavorite,
        toggleFavorite,
        addToHistory,
        clearHistory,
        getFavoriteChannels,
        getRecentChannels,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
