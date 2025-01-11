import { create } from 'zustand'
import { logger } from '@/lib/logger'
import {
  getProfiles,
  getProfile,
  createProfile as createProfileAction,
  updateProfile as updateProfileAction,
  deleteProfile as deleteProfileAction,
  activateProfile as activateProfileAction,
  getActiveProfile as getActiveProfileAction
} from '@/app/actions/profiles'

const profileLogger = logger.withContext('ProfileStore')

export interface ProfileCreate {
  name: string
  emoji?: string
  color?: string
  theme?: string
  language?: string
  description?: string
  isActive?: boolean
}

export interface ProfileUpdate extends Partial<Omit<ProfileCreate, 'name'>> {
  id: string
  name?: string
}

export type Profile = Awaited<ReturnType<typeof getProfile>>

interface ProfilesState {
  profiles: Profile[]
  currentProfile: Profile | null
  activeProfile: Profile | null
  isLoading: boolean
  error: string | null
  // Acciones
  loadProfiles: () => Promise<void>
  createProfile: (data: ProfileCreate) => Promise<void>
  updateProfile: (id: string, data: ProfileUpdate) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  activateProfile: (id: string) => Promise<void>
  loadActiveProfile: () => Promise<void>
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: [],
  currentProfile: null,
  activeProfile: null,
  isLoading: false,
  error: null,

  loadProfiles: async () => {
    try {
      set({ isLoading: true, error: null })
      const profiles = await getProfiles()
      set({ profiles, isLoading: false })
      profileLogger.info('📥 Perfiles cargados:', { count: profiles.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      profileLogger.error('❌ Error al cargar perfiles:', { error })
    }
  },

  createProfile: async (data: ProfileCreate) => {
    try {
      set({ isLoading: true, error: null })
      const profile = await createProfileAction(data)
      set(state => ({
        profiles: [...state.profiles, profile],
        isLoading: false
      }))
      profileLogger.info('✨ Perfil creado:', { profile })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      profileLogger.error('❌ Error al crear perfil:', { error })
    }
  },

  updateProfile: async (id: string, data: ProfileUpdate) => {
    try {
      set({ isLoading: true, error: null })
      const updatedProfile = await updateProfileAction(id, data)
      set(state => ({
        profiles: state.profiles.map(p =>
          p.id === id ? updatedProfile : p
        ),
        currentProfile: state.currentProfile?.id === id ? updatedProfile : state.currentProfile,
        activeProfile: state.activeProfile?.id === id ? updatedProfile : state.activeProfile,
        isLoading: false
      }))
      profileLogger.info('📝 Perfil actualizado:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      profileLogger.error('❌ Error al actualizar perfil:', { id, error })
    }
  },

  deleteProfile: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await deleteProfileAction(id)
      set(state => ({
        profiles: state.profiles.filter(p => p.id !== id),
        currentProfile: state.currentProfile?.id === id ? null : state.currentProfile,
        activeProfile: state.activeProfile?.id === id ? null : state.activeProfile,
        isLoading: false
      }))
      profileLogger.info('🗑️ Perfil eliminado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      profileLogger.error('❌ Error al eliminar perfil:', { id, error })
    }
  },

  activateProfile: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const profile = await activateProfileAction(id)
      set(state => ({
        profiles: state.profiles.map(p => ({
          ...p,
          isActive: p.id === id
        })),
        activeProfile: profile,
        isLoading: false
      }))
      profileLogger.info('🔔 Perfil activado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      profileLogger.error('❌ Error al activar perfil:', { id, error })
    }
  },

  loadActiveProfile: async () => {
    try {
      set({ isLoading: true, error: null })
      const profile = await getActiveProfileAction()
      set({ activeProfile: profile, isLoading: false })
      profileLogger.info('📥 Perfil activo cargado:', { profile: profile.name })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      profileLogger.error('❌ Error al cargar perfil activo:', { error })
    }
  }
}))