import { profileService } from '@/services/profile.service'
import { Profile } from '@prisma/client'

// Mock fetch global
global.fetch = jest.fn()

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProfiles', () => {
    it('debería obtener todos los perfiles exitosamente', async () => {
      const mockProfiles = [
        {
          id: '1',
          name: 'Test Profile',
          emoji: '👤',
          color: '#FF0000',
          theme: 'dark'
        }
      ]

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProfiles)
        })

      const result = await profileService.getProfiles()

      expect(fetch).toHaveBeenCalledWith('/api/profiles')
      expect(result).toEqual(mockProfiles)
    })

    it('debería manejar errores al obtener perfiles', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      })

      await expect(profileService.getProfiles()).rejects.toThrow('Failed to fetch profiles')
    })
  })

  describe('getProfile', () => {
    it('debería obtener un perfil específico exitosamente', async () => {
      const mockProfile = {
        id: '1',
        name: 'Test Profile',
        emoji: '👤',
        color: '#FF0000',
        theme: 'dark'
      }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProfile)
        })

      const result = await profileService.getProfile('1')

      expect(fetch).toHaveBeenCalledWith('/api/profiles/1')
      expect(result).toEqual(mockProfile)
    })

    it('debería retornar null cuando el perfil no existe', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await profileService.getProfile('999')
      expect(result).toBeNull()
    })
  })

  describe('createProfile', () => {
    it('debería crear un perfil exitosamente', async () => {
      const newProfile = {
        name: 'New Profile',
        emoji: '👤',
        color: '#FF0000',
        theme: 'dark',
        language: 'es',
        syncSettings: true,
        notifications: true,
        settings: { key: 'value' }
      }

      const mockResponse = { ...newProfile, id: '1' }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

      const result = await profileService.createProfile(newProfile)

      expect(fetch).toHaveBeenCalledWith('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProfile)
      })
      expect(result).toEqual(mockResponse)
    })

    it('debería manejar errores al crear un perfil', async () => {
      const newProfile = { name: 'New Profile' }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Failed to create profile' })
        })

      await expect(profileService.createProfile(newProfile)).rejects.toThrow('Failed to create profile')
    })
  })

  describe('updateProfile', () => {
    it('debería actualizar un perfil exitosamente', async () => {
      const updateData = {
        id: '1',
        name: 'Updated Profile',
        theme: 'light'
      }

      const mockResponse = { ...updateData }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

      const result = await profileService.updateProfile('1', updateData)

      expect(fetch).toHaveBeenCalledWith('/api/profiles/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      expect(result).toEqual(mockResponse)
    })

    it('debería manejar errores al actualizar un perfil', async () => {
      const updateData = { id: '1', name: 'Updated Profile' }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Failed to update profile' })
        })

      await expect(profileService.updateProfile('1', updateData)).rejects.toThrow('Failed to update profile')
    })
  })

  describe('deleteProfile', () => {
    it('debería eliminar un perfil exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await profileService.deleteProfile('1')

      expect(fetch).toHaveBeenCalledWith('/api/profiles/1', {
        method: 'DELETE'
      })
    })

    it('debería manejar errores al eliminar un perfil', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to delete profile' })
      })

      await expect(profileService.deleteProfile('1')).rejects.toThrow('Failed to delete profile')
    })
  })

  describe('setActiveProfile', () => {
    it('debería establecer un perfil como activo exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await profileService.setActiveProfile('1')

      expect(fetch).toHaveBeenCalledWith('/api/profiles/1/activate', {
        method: 'POST'
      })
    })

    it('debería manejar errores al establecer un perfil como activo', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to set active profile' })
      })

      await expect(profileService.setActiveProfile('1')).rejects.toThrow('Failed to set active profile')
    })
  })
})