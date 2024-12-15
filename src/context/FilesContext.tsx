'use client'

import * as React from 'react'
import { FileItem } from '@/components/file-view/file-view'
import { ViewMode } from '@/lib/constants/sample-data'
import { sampleViewData, sampleCollections, sampleFolders, sampleTags, sampleStats } from '@/lib/constants/sample-data'

// Tipos de acciones
type Action =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_ITEMS'; payload: FileItem[] }
  | { type: 'SET_SELECTED_ITEM'; payload: FileItem | null }
  | { type: 'SET_VIEW'; payload: 'grid' | 'list' | 'details' }
  | { type: 'SET_THUMBNAIL_SIZE'; payload: 'small' | 'medium' | 'large' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PATH'; payload: string[] }

// Estado inicial
interface State {
  currentView: ViewMode
  currentItems: FileItem[]
  selectedItem: FileItem | null
  view: 'grid' | 'list' | 'details'
  thumbnailSize: 'small' | 'medium' | 'large'
  isLoading: boolean
  currentPath: string[]
}

const initialState: State = {
  currentView: 'files',
  currentItems: [],
  selectedItem: null,
  view: 'grid',
  thumbnailSize: 'medium',
  isLoading: false,
  currentPath: ['Inicio']
}

// Reducer
function filesReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, currentView: action.payload }
    case 'SET_ITEMS':
      return { ...state, currentItems: action.payload }
    case 'SET_SELECTED_ITEM':
      return { ...state, selectedItem: action.payload }
    case 'SET_VIEW':
      return { ...state, view: action.payload }
    case 'SET_THUMBNAIL_SIZE':
      return { ...state, thumbnailSize: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_PATH':
      return { ...state, currentPath: action.payload }
    default:
      return state
  }
}

interface FilesContextType extends State {
  collections: typeof sampleCollections
  folders: typeof sampleFolders
  tags: typeof sampleTags
  stats: typeof sampleStats
  setCurrentView: (view: ViewMode) => void
  setCurrentItems: (items: FileItem[]) => void
  setSelectedItem: (item: FileItem | null) => void
  handleSelectCollection: (id: string) => void
  handleSelectFolder: (id: string) => void
  handleSelectTag: (name: string) => void
  handleSelectItem: (item: FileItem) => void
  setView: (view: 'grid' | 'list' | 'details') => void
  setThumbnailSize: (size: 'small' | 'medium' | 'large') => void
}

const FilesContext = React.createContext<FilesContextType | undefined>(undefined)

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(filesReducer, initialState)

  // Memoizar handlers
  const simulateLoading = React.useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  const handleSelectCollection = React.useCallback(async (id: string) => {
    await simulateLoading()
    const collection = sampleCollections.find(c => c.id === id)
    if (collection) {
      dispatch({ type: 'SET_PATH', payload: ['Inicio', 'Colecciones', collection.name] })
      dispatch({ type: 'SET_ITEMS', payload: sampleViewData.collections[id] || [] })
      dispatch({ type: 'SET_VIEW_MODE', payload: 'files' })
    }
  }, [simulateLoading])

  const handleSelectFolder = React.useCallback(async (id: string) => {
    await simulateLoading()
    const folder = sampleFolders.find(f => f.id === id)
    if (folder) {
      dispatch({ type: 'SET_PATH', payload: ['Inicio', 'Carpetas', folder.name] })
      dispatch({ type: 'SET_ITEMS', payload: sampleViewData.folders[id] || [] })
      dispatch({ type: 'SET_VIEW_MODE', payload: 'files' })
    }
  }, [simulateLoading])

  const handleSelectTag = React.useCallback(async (name: string) => {
    await simulateLoading()
    const tag = sampleTags.find(t => t.name === name)
    if (tag) {
      dispatch({ type: 'SET_PATH', payload: ['Inicio', 'Etiquetas', tag.name] })
      dispatch({ type: 'SET_ITEMS', payload: sampleViewData.tags[name] || [] })
      dispatch({ type: 'SET_VIEW_MODE', payload: 'files' })
    }
  }, [simulateLoading])

  const handleSelectItem = React.useCallback((item: FileItem) => {
    dispatch({ type: 'SET_SELECTED_ITEM', payload: item })
    if (item.type === 'folder') {
      dispatch({ type: 'SET_PATH', payload: [...state.currentPath, item.name] })
      dispatch({ type: 'SET_ITEMS', payload: item.children || [] })
    }
  }, [state.currentPath])

  // Cargar datos iniciales
  React.useEffect(() => {
    const allImages = [
      ...Object.values(sampleViewData.collections).flat(),
      ...Object.values(sampleViewData.folders).flat(),
      ...Object.values(sampleViewData.tags).flat()
    ]
    const uniqueImages = Array.from(new Map(allImages.map(item => [item.id, item])).values())
    dispatch({ type: 'SET_ITEMS', payload: uniqueImages })
    dispatch({ type: 'SET_PATH', payload: ['Inicio', 'Todas las imágenes'] })
  }, [])

  // Memoizar el valor del contexto
  const contextValue = React.useMemo(() => ({
    ...state,
    collections: sampleCollections,
    folders: sampleFolders,
    tags: sampleTags,
    stats: sampleStats,
    setCurrentView: (view: ViewMode) => dispatch({ type: 'SET_VIEW_MODE', payload: view }),
    setCurrentItems: (items: FileItem[]) => dispatch({ type: 'SET_ITEMS', payload: items }),
    setSelectedItem: (item: FileItem | null) => dispatch({ type: 'SET_SELECTED_ITEM', payload: item }),
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    handleSelectItem,
    setView: (view: 'grid' | 'list' | 'details') => dispatch({ type: 'SET_VIEW', payload: view }),
    setThumbnailSize: (size: 'small' | 'medium' | 'large') => dispatch({ type: 'SET_THUMBNAIL_SIZE', payload: size })
  }), [state, handleSelectCollection, handleSelectFolder, handleSelectTag, handleSelectItem])

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  )
}

export function useFiles() {
  const context = React.useContext(FilesContext)
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider')
  }
  return context
}