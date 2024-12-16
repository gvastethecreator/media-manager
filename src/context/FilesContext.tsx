'use client'

import * as React from 'react'
import { FileItem } from '@/components/file-view/file-view'
import { ViewMode } from '@/lib/constants/sample-data'
import { sampleViewData, sampleCollections, sampleFolders, sampleTags, sampleStats } from '@/lib/constants/sample-data'

interface FilesContextType {
  currentView: ViewMode
  currentItems: FileItem[]
  selectedItem: FileItem | null
  collections: typeof sampleCollections
  folders: typeof sampleFolders
  tags: typeof sampleTags
  stats: typeof sampleStats
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

const FilesContext = React.createContext<FilesContextType | undefined>(undefined)

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
    const allImages = [
      ...Object.values(sampleViewData.collections).flat(),
      ...Object.values(sampleViewData.folders).flat(),
      ...Object.values(sampleViewData.tags).flat()
    ]
    // Filtrar duplicados por id
    const uniqueImages = Array.from(new Map(allImages.map(item => [item.id, item])).values())
    setCurrentItems(uniqueImages)
    setCurrentPath(['Inicio', 'Todas las imágenes'])
  }, [])

  const simulateLoading = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  const handleSelectCollection = async (id: string) => {
    await simulateLoading()
    const collection = sampleCollections.find(c => c.id === id)
    if (collection) {
      setCurrentPath(['Inicio', 'Colecciones', collection.name])
      setCurrentItems(sampleViewData.collections[id] || [])
      setCurrentView('files')
    }
  }

  const handleSelectFolder = async (id: string) => {
    await simulateLoading()
    const folder = sampleFolders.find(f => f.id === id)
    if (folder) {
      setCurrentPath(['Inicio', 'Carpetas', folder.name])
      setCurrentItems(sampleViewData.folders[id] || [])
      setCurrentView('files')
    }
  }

  const handleSelectTag = async (name: string) => {
    await simulateLoading()
    const tag = sampleTags.find(t => t.name === name)
    if (tag) {
      setCurrentPath(['Inicio', 'Etiquetas', tag.name])
      setCurrentItems(sampleViewData.tags[name] || [])
      setCurrentView('files')
    }
  }

  const handleSelectItem = (item: FileItem) => {
    setSelectedItem(item)
    if (item.type === 'folder') {
      const currentFolder = currentPath[currentPath.length - 1]
      setCurrentPath([...currentPath, item.name])
      // Aquí simularíamos cargar los archivos de la carpeta
      setCurrentItems(item.children || [])
    }
  }

  React.useEffect(() => {
    // Actualizar la ruta según la vista actual
    switch (currentView) {
      case 'cards':
        setCurrentPath(['Inicio', 'Tarjetas'])
        // No limpiamos los items para mantener las tarjetas visibles
        break
      case 'collections':
        setCurrentPath(['Inicio', 'Colecciones'])
        setCurrentItems([]) // No limpiamos los items para mantener las tarjetas visibles
        break
      case 'folders':
        setCurrentPath(['Inicio', 'Carpetas'])
        setCurrentItems([]) // No limpiamos los items para mantener las tarjetas visibles
        break
      case 'tags':
        setCurrentPath(['Inicio', 'Etiquetas'])
        setCurrentItems([]) // No limpiamos los items para mantener las tarjetas visibles
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
        collections: sampleCollections,
        folders: sampleFolders,
        tags: sampleTags,
        stats: sampleStats,
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

export function useFiles() {
  const context = React.useContext(FilesContext)
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider')
  }
  return context
}