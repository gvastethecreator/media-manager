"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Settings } from "@/lib/types"

interface SettingsContextType {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
  error: string | null;
}

const defaultSettings: Settings = {
  theme: 'system',
  language: 'es',
  notifications: true,
  thumbnailQuality: 'medium',
  autoBackup: false,
  compressUploads: true,
  defaultView: 'grid',
  defaultSort: 'date',
  defaultSortOrder: 'desc',
  defaultThumbnailSize: 'medium',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (err) {
        setError('Error loading settings');
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
    error,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Helper hook for theme management
export function useTheme() {
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const theme = settings.theme === 'system' ? systemTheme : settings.theme;

    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [settings.theme]);

  return {
    theme: settings.theme,
    setTheme: (theme: 'light' | 'dark' | 'system') =>
      updateSettings({ theme }),
  };
}