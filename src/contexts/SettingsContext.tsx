import React, { createContext, useContext, useCallback } from 'react';
import { Settings, STORAGE_KEYS, DEFAULT_PIN } from '@/types/settings';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SettingsContextType {
  settings: Settings;
  updatePlaylistUrl: (url: string) => void;
  updateEpgUrl: (url: string) => void;
  updateCustomWorkerUrl: (url: string) => void;
  updateLastUpdated: (timestamp: number) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [playlistUrl, setPlaylistUrl] = useLocalStorage<string>(STORAGE_KEYS.PLAYLIST_URL, '');
  const [epgUrl, setEpgUrl] = useLocalStorage<string>(STORAGE_KEYS.EPG_URL, '');
  const [customWorkerUrl, setCustomWorkerUrl] = useLocalStorage<string>(STORAGE_KEYS.CUSTOM_WORKER_URL, '');
  const [parentalEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.PARENTAL_ENABLED, false);
  const [parentalPin] = useLocalStorage<string>(STORAGE_KEYS.PARENTAL_PIN, DEFAULT_PIN);
  const [lastUpdated, setLastUpdated] = useLocalStorage<number | null>(STORAGE_KEYS.LAST_UPDATED, null);

  const settings: Settings = {
    playlistUrl,
    epgUrl,
    customWorkerUrl,
    parentalEnabled,
    parentalPin,
    lastUpdated,
  };

  const updatePlaylistUrl = useCallback((url: string) => {
    setPlaylistUrl(url);
  }, [setPlaylistUrl]);

  const updateEpgUrl = useCallback((url: string) => {
    setEpgUrl(url);
  }, [setEpgUrl]);

  const updateCustomWorkerUrl = useCallback((url: string) => {
    setCustomWorkerUrl(url);
  }, [setCustomWorkerUrl]);

  const updateLastUpdated = useCallback((timestamp: number) => {
    setLastUpdated(timestamp);
  }, [setLastUpdated]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updatePlaylistUrl,
        updateEpgUrl,
        updateCustomWorkerUrl,
        updateLastUpdated,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
