import { create } from 'zustand'

export type View = 'dashboard' | 'all-images' | 'favorites' | 'files' | 'collections' | 'tags'

interface NavigationState {
  currentView: View
  previousView: View | null
  setCurrentView: (view: View) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'dashboard',
  previousView: null,
  setCurrentView: (view) => set((state) => ({
    currentView: view,
    previousView: state.currentView
  }))
}))