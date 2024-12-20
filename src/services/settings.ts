'use client'

import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings'
import { debounce } from 'lodash'
import { prisma } from '@/lib/db'

class SettingsService {
  private static instance: SettingsService
  private settings: AppSettings
  private saveDebounced: () => Promise<void>

  private constructor() {
    this.settings = DEFAULT_SETTINGS
    this.saveDebounced = debounce(this.saveSettings.bind(this), 1000)
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  public async init(): Promise<void> {
    try {
      await this.loadSettings()
    } catch (error) {
      console.warn('No se pudo cargar la configuración:', error)
      await this.saveSettings()
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      // Primero intentamos cargar desde localStorage
      const stored = localStorage.getItem('app-settings')
      if (stored) {
        const loadedSettings = JSON.parse(stored) as AppSettings
        this.settings = this.migrateSettings(loadedSettings)
        return
      }

      // Si no hay datos en localStorage, intentamos cargar desde la API
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Error al cargar la configuración')
      const loadedSettings = await response.json() as AppSettings
      this.settings = this.migrateSettings(loadedSettings)

      // Guardamos en localStorage para acceso rápido
      localStorage.setItem('app-settings', JSON.stringify(this.settings))
    } catch (error) {
      throw new Error('Error al cargar la configuración')
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      // Guardamos en localStorage
      localStorage.setItem('app-settings', JSON.stringify(this.settings))

      // Guardamos en el servidor a través de la API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.settings),
      })

      if (!response.ok) throw new Error('Error al guardar la configuración')
    } catch (error) {
      console.error('Error al guardar la configuración:', error)
    }
  }

  private migrateSettings(loadedSettings: AppSettings): AppSettings {
    // Aquí podemos implementar la migración de versiones antiguas
    if (loadedSettings.version !== DEFAULT_SETTINGS.version) {
      // Implementar lógica de migración
      loadedSettings.version = DEFAULT_SETTINGS.version
    }
    return {
      ...DEFAULT_SETTINGS,
      ...loadedSettings,
      lastUpdate: new Date().toISOString()
    }
  }

  public getSettings(): AppSettings {
    return { ...this.settings }
  }

  public async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...newSettings,
      lastUpdate: new Date().toISOString()
    }
    await this.saveDebounced()
  }

  public async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS }
    await this.saveSettings()
  }

  public async exportSettings(): Promise<string> {
    return JSON.stringify(this.settings, null, 2)
  }

  public async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson) as AppSettings
      this.settings = this.migrateSettings(importedSettings)
      await this.saveSettings()
    } catch (error) {
      throw new Error('Error al importar la configuración')
    }
  }

  // Métodos específicos para cada sección
  public getAppearanceSettings() {
    return { ...this.settings.appearance }
  }

  public getFolderSettings() {
    return [...this.settings.folders]
  }

  public getCollectionSettings() {
    return [...this.settings.collections]
  }

  public getTagSettings() {
    return [...this.settings.tags]
  }

  public getShortcutSettings() {
    return [...this.settings.shortcuts]
  }

  public getProfileSettings() {
    return [...this.settings.profiles]
  }

  public getSystemSettings() {
    return { ...this.settings.system }
  }

  public getActiveProfile() {
    return this.settings.profiles.find(p => p.id === this.settings.activeProfile)
  }

  public async updateAppearanceSettings(settings: Partial<AppSettings['appearance']>): Promise<void> {
    this.settings.appearance = {
      ...this.settings.appearance,
      ...settings
    }
    await this.saveDebounced()
  }

  public async updateFolderSettings(folderId: string, settings: Partial<AppSettings['folders'][0]>): Promise<void> {
    const index = this.settings.folders.findIndex(f => f.path === folderId)
    if (index !== -1) {
      this.settings.folders[index] = {
        ...this.settings.folders[index],
        ...settings
      }
      await this.saveDebounced()
    }
  }

  public async updateCollectionSettings(collectionId: string, settings: Partial<AppSettings['collections'][0]>): Promise<void> {
    const index = this.settings.collections.findIndex(c => c.id === collectionId)
    if (index !== -1) {
      this.settings.collections[index] = {
        ...this.settings.collections[index],
        ...settings
      }
      await this.saveDebounced()
    }
  }

  public async updateTagSettings(tagId: string, settings: Partial<AppSettings['tags'][0]>): Promise<void> {
    const index = this.settings.tags.findIndex(t => t.id === tagId)
    if (index !== -1) {
      this.settings.tags[index] = {
        ...this.settings.tags[index],
        ...settings
      }
      await this.saveDebounced()
    }
  }

  public async updateShortcutSettings(shortcutId: string, settings: Partial<AppSettings['shortcuts'][0]>): Promise<void> {
    const index = this.settings.shortcuts.findIndex(s => s.id === shortcutId)
    if (index !== -1) {
      this.settings.shortcuts[index] = {
        ...this.settings.shortcuts[index],
        ...settings
      }
      await this.saveDebounced()
    }
  }

  public async updateProfileSettings(profileId: string, settings: Partial<AppSettings['profiles'][0]>): Promise<void> {
    const index = this.settings.profiles.findIndex(p => p.id === profileId)
    if (index !== -1) {
      this.settings.profiles[index] = {
        ...this.settings.profiles[index],
        ...settings
      }
      await this.saveDebounced()
    }
  }

  public async updateSystemSettings(settings: Partial<AppSettings['system']>): Promise<void> {
    this.settings.system = {
      ...this.settings.system,
      ...settings
    }
    await this.saveDebounced()
  }

  public async setActiveProfile(profileId: string): Promise<void> {
    if (this.settings.profiles.some(p => p.id === profileId)) {
      this.settings.activeProfile = profileId
      await this.saveDebounced()
    }
  }
}

export const settingsService = SettingsService.getInstance()

export async function initializeSettings() {
  try {
    // Verificar si existe un perfil activo
    const activeProfile = await prisma.profile.findFirst({
      where: { isActive: true }
    })

    // Si no hay perfil activo, crear uno por defecto
    if (!activeProfile) {
      await prisma.profile.create({
        data: {
          name: 'Default',
          emoji: '👤',
          color: '#3b82f6',
          theme: 'system',
          language: 'es',
          isActive: true
        }
      })
      console.log('⚙️ [Settings] Perfil por defecto creado')
    }

    // Cargar configuraciones adicionales si es necesario
    // TODO: Agregar más configuraciones según sea necesario

    console.log('⚙️ [Settings] Configuraciones inicializadas')
    return true
  } catch (error) {
    console.error('❌ [Settings] Error al inicializar:', error)
    throw error
  }
}