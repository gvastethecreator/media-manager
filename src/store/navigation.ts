import { create } from 'zustand'
import { ViewType } from '@/types/file-item'

interface NavigationState {
  currentView: ViewType
  navigationDirection: number
  previousView: ViewType | null
  setCurrentView: (view: ViewType) => void
  goBack: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'dashboard',
  navigationDirection: 0,
  previousView: null,
  setCurrentView: (view) =>
    set((state) => ({
      previousView: state.currentView,
      currentView: view,
      navigationDirection: getNavigationDirection(state.currentView, view),
    })),
  goBack: () =>
    set((state) => ({
      currentView: state.previousView || 'dashboard',
      previousView: state.currentView,
      navigationDirection: -1,
    })),
}))

// Helper para determinar la dirección de la navegación
function getNavigationDirection(currentView: ViewType, nextView: ViewType): number {
  const viewOrder: ViewType[] = [
    'dashboard',
    'all-images',
    'collections',
    'collection-content',
    'folders',
    'folder-content',
    'tags',
    'tag-content',
    'search',
    'files',
    'settings',
    'favorites'
  ]

  const currentIndex = viewOrder.indexOf(currentView)
  const nextIndex = viewOrder.indexOf(nextView)

  if (currentIndex === -1 || nextIndex === -1) return 0
  return nextIndex > currentIndex ? 1 : -1
}