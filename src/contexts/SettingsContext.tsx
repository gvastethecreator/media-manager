'use client'

import React, { createContext, useContext, useEffect, useCallback } from 'react'
import { useSettings } from '@/hooks/useSettings'
import type { AppSettings } from '@/types/settings'

interface SettingsContextValue {
  settings: AppSettings
  loading: boolean
  error: Error | null
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
  exportSettings: () => Promise<string>
  importSettings: (settingsJson: string) => Promise<void>
  updateAppearance: (settings: Partial<AppSettings['appearance']>) => Promise<void>
  updateFolder: (folderId: string, settings: Partial<AppSettings['folders'][0]>) => Promise<void>
  updateCollection: (collectionId: string, settings: Partial<AppSettings['collections'][0]>) => Promise<void>
  updateTag: (tagId: string, settings: Partial<AppSettings['tags'][0]>) => Promise<void>
  updateShortcut: (shortcutId: string, settings: Partial<AppSettings['shortcuts'][0]>) => Promise<void>
  updateProfile: (profileId: string, settings: Partial<AppSettings['profiles'][0]>) => Promise<void>
  updateSystem: (settings: Partial<AppSettings['system']>) => Promise<void>
  setActiveProfile: (profileId: string) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    updateAppearance,
    updateFolder,
    updateCollection,
    updateTag,
    updateShortcut,
    updateProfile,
    updateSystem,
    setActiveProfile
  } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">
          Error al cargar la configuración: {error.message}
        </div>
      </div>
    )
  }

  const contextValue: SettingsContextValue = {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    updateAppearance,
    updateFolder,
    updateCollection,
    updateTag,
    updateShortcut,
    updateProfile,
    updateSystem,
    setActiveProfile
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsContext debe ser usado dentro de un SettingsProvider')
  }
  return context
}