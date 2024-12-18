import { AppSettings } from '@/types/settings'
import defaultSettings from '@/config/settings.json'
import { deepMerge } from '@/lib/utils'

const SETTINGS_KEY = 'image-manager-settings'

export function loadSettings(): AppSettings {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (!savedSettings) {
      return defaultSettings as AppSettings
    }

    const parsedSettings = JSON.parse(savedSettings)
    return deepMerge(defaultSettings, parsedSettings) as AppSettings
  } catch (error) {
    console.error('Error loading settings:', error)
    return defaultSettings as AppSettings
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

export function resetSettings(): AppSettings {
  localStorage.removeItem(SETTINGS_KEY)
  return defaultSettings as AppSettings
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const currentSettings = loadSettings()
  const newSettings = deepMerge(currentSettings, settings)
  saveSettings(newSettings)
  return newSettings
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  const settings = loadSettings()
  return settings[key]
}

export function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void {
  const settings = loadSettings()
  settings[key] = value
  saveSettings(settings)
}

// Función para exportar la configuración
export function exportSettings(): string {
  const settings = loadSettings()
  return JSON.stringify(settings, null, 2)
}

// Función para importar la configuración
export function importSettings(jsonString: string): AppSettings {
  try {
    const importedSettings = JSON.parse(jsonString)
    const mergedSettings = deepMerge(defaultSettings, importedSettings)
    saveSettings(mergedSettings)
    return mergedSettings as AppSettings
  } catch (error) {
    console.error('Error importing settings:', error)
    return defaultSettings as AppSettings
  }
}

// Función para migrar la configuración a una nueva versión
export function migrateSettings(settings: AppSettings): AppSettings {
  // Aquí puedes agregar lógica para migrar configuraciones antiguas
  // Por ejemplo, si cambias la estructura de la configuración en una nueva versión
  return settings
}

// Función para validar la configuración
export function validateSettings(settings: unknown): settings is AppSettings {
  if (!settings || typeof settings !== 'object') {
    return false
  }

  // Aquí puedes agregar más validaciones según tus necesidades
  const requiredKeys: (keyof AppSettings)[] = [
    'version',
    'lastUpdate',
    'appearance',
    'system',
  ]

  return requiredKeys.every((key) => key in settings)
}
