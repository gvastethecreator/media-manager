import { create } from 'zustand'

interface ServiceStatus {
  name: string
  status: 'pending' | 'loading' | 'success' | 'error'
  message?: string
}

interface LoadingState {
  isInitializing: boolean
  services: ServiceStatus[]
  progress: number
  updateService: (name: string, status: ServiceStatus['status'], message?: string) => void
  setProgress: (progress: number) => void
  setInitializing: (isInitializing: boolean) => void
  resetState: () => void
}

const initialServices = [
  { name: 'Database', status: 'pending' as const },
  { name: 'File System', status: 'pending' as const },
  { name: 'Settings', status: 'pending' as const },
  { name: 'Thumbnails', status: 'pending' as const },
  { name: 'System', status: 'pending' as const },
]

export const useLoadingStore = create<LoadingState>((set) => ({
  isInitializing: true,
  services: initialServices,
  progress: 0,
  updateService: (name, status, message) =>
    set((state) => ({
      services: state.services.map((service) =>
        service.name === name ? { ...service, status, message } : service
      ),
    })),
  setProgress: (progress) => set({ progress }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  resetState: () =>
    set({
      isInitializing: true,
      services: initialServices,
      progress: 0,
    }),
}))