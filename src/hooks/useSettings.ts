import { useEffect, useState } from 'react'
import { settingsService } from '@/services/settings'
import type { AppSettings } from '@/types/settings'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initSettings = async () => {
      try {
        await settingsService.init()
        setSettings(settingsService.getSettings())
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al inicializar la configuración'))
      } finally {
        setLoading(false)
      }
    }

    initSettings()
  }, [])

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await settingsService.updateSettings(newSettings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar la configuración'))
    }
  }

  const resetSettings = async () => {
    try {
      await settingsService.resetSettings()
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al restablecer la configuración'))
    }
  }

  const exportSettings = async (path: string) => {
    try {
      await settingsService.exportSettings(path)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al exportar la configuración'))
    }
  }

  const importSettings = async (path: string) => {
    try {
      await settingsService.importSettings(path)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al importar la configuración'))
    }
  }

  // Métodos específicos para cada sección
  const updateAppearance = async (settings: Partial<AppSettings['appearance']>) => {
    try {
      await settingsService.updateAppearanceSettings(settings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar la apariencia'))
    }
  }

  const updateFolder = async (folderId: string, settings: Partial<AppSettings['folders'][0]>) => {
    try {
      await settingsService.updateFolderSettings(folderId, settings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar la carpeta'))
    }
  }

  const updateCollection = async (collectionId: string, settings: Partial<AppSettings['collections'][0]>) => {
    try {
      await settingsService.updateCollectionSettings(collectionId, settings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar la colección'))
    }
  }

  const updateTag = async (tagId: string, settings: Partial<AppSettings['tags'][0]>) => {
    try {
      await settingsService.updateTagSettings(tagId, settings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar la etiqueta'))
    }
  }

  const updateShortcut = async (shortcutId: string, settings: Partial<AppSettings['shortcuts'][0]>) => {
    try {
      await settingsService.updateShortcutSettings(shortcutId, settings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar el atajo'))
    }
  }

  const updateProfile = async (profileId: string, settings: Partial<AppSettings['profiles'][0]>) => {
    try {
      await settingsService.updateProfileSettings(profileId, settings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar el perfil'))
    }
  }

  const updateSystem = async (settings: Partial<AppSettings['system']>) => {
    try {
      await settingsService.updateSystemSettings(settings)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar el sistema'))
    }
  }

  const setActiveProfile = async (profileId: string) => {
    try {
      await settingsService.setActiveProfile(profileId)
      setSettings(settingsService.getSettings())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cambiar el perfil activo'))
    }
  }

  return {
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
}