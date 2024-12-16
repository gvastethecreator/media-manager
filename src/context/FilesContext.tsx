'use client'

import React from 'react'
import { mockCollections, mockFolders, mockTags, mockStats, mockFiles } from '@/lib/mock-data'
import type { FileItem } from '@/store/files'

type ViewMode = 'files' | 'collections' | 'folders' | 'tags' | 'cards'

interface FilesContextType {
  currentView: ViewMode
  currentItems: FileItem[]
  selectedItem: FileItem | null
  collections: typeof mockCollections
  folders: typeof mockFolders
  tags: typeof mockTags
  stats: typeof mockStats
  view: 'grid' | 'list' | 'details'
  thumbnailSize: 'small' | 'medium' | 'large'
  isLoading: boolean
  currentPath: string[]
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

const FilesContext = React.createContext<FilesContextType | null>(null)

export function useFiles() {
  const context = React.useContext(FilesContext)
  if (!context) {
    throw new Error('useFiles must be used within a FilesProvider')
  }
  return context
}

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = React.useState<ViewMode>('files')
  const [currentItems, setCurrentItems] = React.useState<FileItem[]>([])
  const [selectedItem, setSelectedItem] = React.useState<FileItem | null>(null)
  const [view, setView] = React.useState<'grid' | 'list' | 'details'>('grid')
  const [thumbnailSize, setThumbnailSize] = React.useState<'small' | 'medium' | 'large'>('medium')
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentPath, setCurrentPath] = React.useState<string[]>(['Inicio'])

  // Cargar todas las imágenes al iniciar
  React.useEffect(() => {
    // Inicializar con todos los archivos
    setCurrentItems(mockFiles)
    setCurrentPath(['Inicio', 'Todas las imágenes'])
  }, [])

  const simulateLoading = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  const handleSelectCollection = async (id: string) => {
    await simulateLoading()
    const collection = mockCollections.find(c => c.id === id)
    if (collection) {
      const collectionFiles = mockFiles.filter(file =>
        collection.tags.some(tag => file.tags.includes(tag))
      )
      setCurrentPath(['Inicio', 'Colecciones', collection.name])
      setCurrentItems(collectionFiles)
      setCurrentView('files')
    }
  }

  const handleSelectFolder = async (id: string) => {
    await simulateLoading()
    const folder = mockFolders.find(f => f.id === id)
    if (folder) {
      const folderFiles = mockFiles.filter(file =>
        file.path.startsWith(`/${folder.name}/`)
      )
      setCurrentPath(['Inicio', 'Carpetas', folder.name])
      setCurrentItems(folderFiles)
      setCurrentView('files')
    }
  }

  const handleSelectTag = async (name: string) => {
    await simulateLoading()
    const tag = mockTags.find(t => t.name === name)
    if (tag) {
      const tagFiles = mockFiles.filter(file =>
        file.tags.includes(tag.name)
      )
      setCurrentPath(['Inicio', 'Etiquetas', tag.name])
      setCurrentItems(tagFiles)
      setCurrentView('files')
    }
  }

  const handleSelectItem = (item: FileItem) => {
    console.log('FilesContext: handleSelectItem', item)
    setSelectedItem(item)
  }

  React.useEffect(() => {
    // Actualizar la ruta según la vista actual
    switch (currentView) {
      case 'cards':
        setCurrentPath(['Inicio', 'Tarjetas'])
        break
      case 'collections':
        setCurrentPath(['Inicio', 'Colecciones'])
        break
      case 'folders':
        setCurrentPath(['Inicio', 'Carpetas'])
        break
      case 'tags':
        setCurrentPath(['Inicio', 'Etiquetas'])
        break
      case 'files':
        // No actualizamos la ruta aquí ya que se maneja en los handlers
        break
    }
  }, [currentView])

  return (
    <FilesContext.Provider
      value={{
        currentView,
        currentItems,
        selectedItem,
        collections: mockCollections,
        folders: mockFolders,
        tags: mockTags,
        stats: mockStats,
        view,
        thumbnailSize,
        isLoading,
        currentPath,
        setCurrentView,
        setCurrentItems,
        setSelectedItem,
        handleSelectCollection,
        handleSelectFolder,
        handleSelectTag,
        handleSelectItem,
        setView,
        setThumbnailSize,
      }}
    >
      {children}
    </FilesContext.Provider>
  )
}