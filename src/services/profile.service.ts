import type { Profile } from '@prisma/client'
import type { BaseEntity } from '@/store/types'

export interface ProfileCreate {
  name: string
  emoji?: string
  color?: string
  theme?: string
  language?: string
  description?: string
  shortcut?: string
  syncSettings?: boolean
  notifications?: boolean
  settings?: Record<string, any>
}

export interface ProfileUpdate extends Partial<ProfileCreate> {
  id: string
  isActive?: boolean
}

export interface ProfileWithStats extends Profile, BaseEntity {
  _count?: {
    images: number
  }
  totalSize?: number
  isActive: boolean
}

export const profileService = {
  async getProfiles(): Promise<ProfileWithStats[]> {
    try {
      const response = await fetch('/api/profiles')
      if (!response.ok) {
        throw new Error('Failed to fetch profiles')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching profiles:', error)
      throw error
    }
  },

  async getProfile(id: string): Promise<ProfileWithStats | null> {
    try {
      const response = await fetch(`/api/profiles/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  },

  async createProfile(data: ProfileCreate): Promise<Profile> {
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create profile')
      }

      return response.json()
    } catch (error) {
      console.error('Error creating profile:', error)
      throw error
    }
  },

  async updateProfile(id: string, data: ProfileUpdate): Promise<Profile> {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update profile')
      }

      return response.json()
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  async deleteProfile(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete profile')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  },

  async setActiveProfile(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/profiles/${id}/activate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to set active profile')
      }
    } catch (error) {
      console.error('Error setting active profile:', error)
      throw error
    }
  }
}
