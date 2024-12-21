import { create } from 'zustand'

interface ServiceStatus {
  name: string
  status: 'pending' | 'loading' | 'success' | 'error'
  message?: string
  startTime?: number
  endTime?: number
}

interface LoadingState {
  isInitializing: boolean
  isReady: boolean
  services: ServiceStatus[]
  progress: number
  updateService: (name: string, status: ServiceStatus['status'], message?: string) => void
  setProgress: (progress: number) => void
  setInitializing: (isInitializing: boolean) => void
  setReady: (isReady: boolean) => void
  resetState: () => void
}

const initialServices = [
  { name: 'Database', status: 'pending' as const },
  { name: 'File System', status: 'pending' as const },
  { name: 'Settings', status: 'pending' as const },
  { name: 'Thumbnails', status: 'pending' as const },
  { name: 'System', status: 'pending' as const },
]

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isInitializing: true,
  isReady: false,
  services: initialServices,
  progress: 0,
  updateService: (name, status, message) =>
    set((state) => {
      const now = Date.now()
      const updatedServices = state.services.map((service) =>
        service.name === name
          ? {
            ...service,
            status,
            message,
            startTime: service.startTime || (status === 'loading' ? now : undefined),
            endTime: ['success', 'error'].includes(status) ? now : undefined,
          }
          : service
      )

      // Calcular progreso basado en servicios completados
      const totalServices = updatedServices.length
      const completedServices = updatedServices.filter(
        (s) => s.status === 'success' || s.status === 'error'
      ).length
      const progress = Math.round((completedServices / totalServices) * 100)

      // Verificar si todos los servicios están completados
      const allCompleted = updatedServices.every(
        (s) => s.status === 'success' || s.status === 'error'
      )
      const allSuccess = updatedServices.every((s) => s.status === 'success')

      return {
        services: updatedServices,
        progress,
        isReady: allCompleted && allSuccess,
      }
    }),
  setProgress: (progress) => set({ progress }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setReady: (isReady) => set({ isReady }),
  resetState: () =>
    set({
      isInitializing: true,
      isReady: false,
      services: initialServices,
      progress: 0,
    }),
}))

// Selectores útiles
export const useIsAppReady = () => useLoadingStore((state) => state.isReady)
export const useInitializationProgress = () => useLoadingStore((state) => state.progress)
export const useServiceStatus = (serviceName: string) =>
  useLoadingStore((state) =>
    state.services.find((service) => service.name === serviceName)
  )