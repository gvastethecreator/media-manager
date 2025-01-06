import { settingsService, initializeSettings } from '@/services/settings'
import { prisma } from '@/lib/db'
import { DEFAULT_SETTINGS } from '@/types/settings'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch global
global.fetch = jest.fn()

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    profile: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}))

describe('Settings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
    console.warn = jest.fn()
  })

  describe('getInstance', () => {
    it('debería retornar siempre la misma instancia', () => {
      const instance1 = settingsService
      const instance2 = settingsService

      expect(instance1).toBe(instance2)
    })
  })

  describe('init', () => {
    it('debería cargar configuraciones desde localStorage', async () => {
      const mockSettings = {
        ...DEFAULT_SETTINGS,
        appearance: { theme: 'dark' }
      }

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockSettings))

      await settingsService.init()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('app-settings')
      expect(settingsService.getSettings()).toEqual(expect.objectContaining({
        appearance: { theme: 'dark' }
      }))
    })

    it('debería cargar configuraciones desde la API si no hay en localStorage', async () => {
      const mockSettings = {
        ...DEFAULT_SETTINGS,
        appearance: { theme: 'light' }
      }

      localStorageMock.getItem.mockReturnValueOnce(null)
        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSettings)
        })

      await settingsService.init()

      expect(fetch).toHaveBeenCalledWith('/api/settings')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-settings', expect.any(String))
    })

    it('debería manejar errores durante la inicialización', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false
        })

      await settingsService.init()

      expect(console.warn).toHaveBeenCalledWith(
        'No se pudo cargar la configuración:',
        expect.any(Error)
      )
    })
  })

  describe('updateSettings', () => {
    it('debería actualizar las configuraciones y guardarlas', async () => {
      const newSettings = {
        appearance: { theme: 'dark' }
      }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true
        })

      await settingsService.updateSettings(newSettings)

      expect(localStorageMock.setItem).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledWith('/api/settings', expect.any(Object))
    })
  })

  describe('resetSettings', () => {
    it('debería restablecer las configuraciones a los valores por defecto', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await settingsService.resetSettings()

      expect(settingsService.getSettings()).toEqual(expect.objectContaining(DEFAULT_SETTINGS))
      expect(localStorageMock.setItem).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledWith('/api/settings', expect.any(Object))
    })
  })

  describe('exportSettings', () => {
    it('debería exportar las configuraciones como JSON', async () => {
      const settings = await settingsService.exportSettings()
      expect(JSON.parse(settings)).toEqual(expect.objectContaining(DEFAULT_SETTINGS))
    })
  })

  describe('importSettings', () => {
    it('debería importar configuraciones válidas', async () => {
      const mockSettings = {
        ...DEFAULT_SETTINGS,
        appearance: { theme: 'dark' }
      }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true
        })

      await settingsService.importSettings(JSON.stringify(mockSettings))

      expect(settingsService.getSettings()).toEqual(expect.objectContaining({
        appearance: { theme: 'dark' }
      }))
    })

    it('debería manejar errores al importar configuraciones inválidas', async () => {
      await expect(settingsService.importSettings('invalid-json'))
        .rejects.toThrow('Error al importar la configuración')
    })
  })

  describe('initializeSettings', () => {
    it('debería crear un perfil por defecto si no existe uno activo', async () => {
      ; (prisma.profile.findFirst as jest.Mock).mockResolvedValueOnce(null)
        ; (prisma.profile.create as jest.Mock).mockResolvedValueOnce({
          id: '1',
          name: 'Default',
          emoji: '👤',
          color: '#3b82f6',
          theme: 'system',
          language: 'es',
          isActive: true
        })

      const result = await initializeSettings()

      expect(prisma.profile.findFirst).toHaveBeenCalledWith({
        where: { isActive: true }
      })
      expect(prisma.profile.create).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('no debería crear un perfil si ya existe uno activo', async () => {
      ; (prisma.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        id: '1',
        isActive: true
      })

      const result = await initializeSettings()

      expect(prisma.profile.create).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('debería manejar errores durante la inicialización', async () => {
      const error = new Error('Test error')
        ; (prisma.profile.findFirst as jest.Mock).mockRejectedValueOnce(error)

      await expect(initializeSettings()).rejects.toThrow(error)
      expect(console.error).toHaveBeenCalledWith('❌ [Settings] Error al inicializar:', error)
    })
  })

  // Tests para métodos específicos de secciones
  describe('Métodos de secciones específicas', () => {
    beforeEach(async () => {
      // Inicializar con configuraciones de prueba
      const mockSettings = {
        ...DEFAULT_SETTINGS,
        appearance: { theme: 'dark' },
        folders: [{ id: '1', path: '/test' }],
        collections: [{ id: '1', name: 'Test' }],
        tags: [{ id: '1', name: 'Test' }],
        shortcuts: [{ id: '1', key: 'ctrl+t' }],
        profiles: [{ id: '1', name: 'Test' }],
        system: { language: 'es' }
      }

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockSettings))
      await settingsService.init()
    })

    it('debería obtener configuraciones de apariencia', () => {
      const appearance = settingsService.getAppearanceSettings()
      expect(appearance).toEqual({ theme: 'dark' })
    })

    it('debería obtener configuraciones de carpetas', () => {
      const folders = settingsService.getFolderSettings()
      expect(folders).toEqual([{ id: '1', path: '/test' }])
    })

    it('debería obtener configuraciones de colecciones', () => {
      const collections = settingsService.getCollectionSettings()
      expect(collections).toEqual([{ id: '1', name: 'Test' }])
    })

    it('debería obtener configuraciones de etiquetas', () => {
      const tags = settingsService.getTagSettings()
      expect(tags).toEqual([{ id: '1', name: 'Test' }])
    })

    it('debería obtener configuraciones de atajos', () => {
      const shortcuts = settingsService.getShortcutSettings()
      expect(shortcuts).toEqual([{ id: '1', key: 'ctrl+t' }])
    })

    it('debería obtener configuraciones de perfiles', () => {
      const profiles = settingsService.getProfileSettings()
      expect(profiles).toEqual([{ id: '1', name: 'Test' }])
    })

    it('debería obtener configuraciones del sistema', () => {
      const system = settingsService.getSystemSettings()
      expect(system).toEqual({ language: 'es' })
    })
  })

  // Tests para métodos de actualización de secciones específicas
  describe('Métodos de actualización de secciones', () => {
    beforeEach(async () => {
      ; (fetch as jest.Mock).mockResolvedValue({
        ok: true
      })
    })

    it('debería actualizar configuraciones de apariencia', async () => {
      await settingsService.updateAppearanceSettings({ theme: 'light' })
      expect(settingsService.getAppearanceSettings().theme).toBe('light')
    })

    it('debería actualizar configuraciones de carpeta', async () => {
      await settingsService.updateFolderSettings('1', { path: '/new-path' })
      const folders = settingsService.getFolderSettings()
      const updatedFolder = folders.find(f => f.path === '1')
      expect(updatedFolder).toBeDefined()
    })

    it('debería actualizar configuraciones de colección', async () => {
      await settingsService.updateCollectionSettings('1', { name: 'Updated' })
      const collections = settingsService.getCollectionSettings()
      const updatedCollection = collections.find(c => c.id === '1')
      expect(updatedCollection).toBeDefined()
    })

    it('debería actualizar configuraciones de etiqueta', async () => {
      await settingsService.updateTagSettings('1', { name: 'Updated' })
      const tags = settingsService.getTagSettings()
      const updatedTag = tags.find(t => t.id === '1')
      expect(updatedTag).toBeDefined()
    })

    it('debería actualizar configuraciones de atajo', async () => {
      await settingsService.updateShortcutSettings('1', { key: 'ctrl+n' })
      const shortcuts = settingsService.getShortcutSettings()
      const updatedShortcut = shortcuts.find(s => s.id === '1')
      expect(updatedShortcut).toBeDefined()
    })

    it('debería actualizar configuraciones de perfil', async () => {
      await settingsService.updateProfileSettings('1', { name: 'Updated' })
      const profiles = settingsService.getProfileSettings()
      const updatedProfile = profiles.find(p => p.id === '1')
      expect(updatedProfile).toBeDefined()
    })

    it('debería actualizar configuraciones del sistema', async () => {
      await settingsService.updateSystemSettings({ language: 'en' })
      expect(settingsService.getSystemSettings().language).toBe('en')
    })

    it('debería establecer el perfil activo', async () => {
      await settingsService.setActiveProfile('1')
      const activeProfile = settingsService.getActiveProfile()
      expect(activeProfile?.id).toBe('1')
    })
  })
})