import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS, DEFAULT_PIN } from '@/types/settings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { isAdultContent } from '@/services/categoryClassifier';

interface ParentalContextType {
  isParentalEnabled: boolean;
  isUnlocked: boolean;
  unlockTimeRemaining: number;
  enableParental: () => void;
  disableParental: (pin: string) => boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
  changePin: (currentPin: string, newPin: string) => boolean;
  isContentBlocked: (name: string, group?: string) => boolean;
  validatePin: (pin: string) => boolean;
}

const ParentalContext = createContext<ParentalContextType | null>(null);

const UNLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

export function ParentalProvider({ children }: { children: React.ReactNode }) {
  const [isParentalEnabled, setIsParentalEnabled] = useLocalStorage<boolean>(
    STORAGE_KEYS.PARENTAL_ENABLED,
    false
  );
  const [pin, setPin] = useLocalStorage<string>(STORAGE_KEYS.PARENTAL_PIN, DEFAULT_PIN);
  const [unlockUntil, setUnlockUntil] = useState<number | null>(null);
  const [unlockTimeRemaining, setUnlockTimeRemaining] = useState(0);

  const isUnlocked = unlockUntil !== null && Date.now() < unlockUntil;

  // Update remaining time countdown
  useEffect(() => {
    if (!unlockUntil) {
      setUnlockTimeRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, unlockUntil - Date.now());
      setUnlockTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setUnlockUntil(null);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [unlockUntil]);

  const validatePin = useCallback((inputPin: string) => {
    return inputPin === pin;
  }, [pin]);

  const enableParental = useCallback(() => {
    setIsParentalEnabled(true);
  }, [setIsParentalEnabled]);

  const disableParental = useCallback((inputPin: string) => {
    if (validatePin(inputPin)) {
      setIsParentalEnabled(false);
      setUnlockUntil(null);
      return true;
    }
    return false;
  }, [validatePin, setIsParentalEnabled]);

  const unlock = useCallback((inputPin: string) => {
    if (validatePin(inputPin)) {
      setUnlockUntil(Date.now() + UNLOCK_DURATION);
      return true;
    }
    return false;
  }, [validatePin]);

  const lock = useCallback(() => {
    setUnlockUntil(null);
  }, []);

  const changePin = useCallback((currentPin: string, newPin: string) => {
    if (!validatePin(currentPin)) {
      return false;
    }
    
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      return false;
    }

    setPin(newPin);
    return true;
  }, [validatePin, setPin]);

  const isContentBlocked = useCallback((name: string, group?: string) => {
    if (!isParentalEnabled || isUnlocked) {
      return false;
    }
    return isAdultContent(name, group);
  }, [isParentalEnabled, isUnlocked]);

  return (
    <ParentalContext.Provider
      value={{
        isParentalEnabled,
        isUnlocked,
        unlockTimeRemaining,
        enableParental,
        disableParental,
        unlock,
        lock,
        changePin,
        isContentBlocked,
        validatePin,
      }}
    >
      {children}
    </ParentalContext.Provider>
  );
}

export function useParental() {
  const context = useContext(ParentalContext);
  if (!context) {
    throw new Error('useParental must be used within a ParentalProvider');
  }
  return context;
}
