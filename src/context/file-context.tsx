'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { mockCollections, mockFolders, mockTags, mockFiles } from '@/lib/mock-data'
import type { FileItem } from '@/types/files'

type ViewMode = 'files' | 'collections' | 'folders' | 'tags' | 'cards'
type ViewType = 'grid' | 'list' | 'details'
type ThumbnailSize = 'small' | 'medium' | 'large'

interface FilesContextType {
  currentView: ViewMode
  currentItems: FileItem[]
  selectedItem: FileItem | null
  collections: typeof mockCollections
  folders: typeof mockFolders
  tags: typeof mockTags
  view: ViewType
  thumbnailSize: ThumbnailSize
  isLoading: boolean
  currentPath: string[]
  setCurrentView: (view: ViewMode) => void
  setCurrentItems: (items: FileItem[]) => void
  setSelectedItem: (item: FileItem | null) => void
  handleSelectCollection: (id: string) => void
  handleSelectFolder: (id: string) => void
  handleSelectTag: (name: string) => void
  handleSelectItem: (item: FileItem) => void
  setView: (view: ViewType) => void
  setThumbnailSize: (size: ThumbnailSize) => void
}

const FilesContext = createContext<FilesContextType | null>(null)

export function useFiles() {
  const context = useContext(FilesContext)
  if (!context) {
    throw new Error('useFiles debe ser usado dentro de un FilesProvider')
  }
  return context
}

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewMode>('files')
  const [currentItems, setCurrentItems] = useState<FileItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [view, setView] = useState<ViewType>('grid')
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPath, setCurrentPath] = useState<string[]>(['Inicio'])

  // Cargar datos iniciales
  useEffect(() => {
    console.log('📦 Cargando datos iniciales...')
    try {
      setCurrentItems(mockFiles)
      setCurrentPath(['Inicio', 'Todas las imágenes'])
      console.log('✅ Datos iniciales cargados correctamente')
    } catch (error) {
      console.error('❌ Error al cargar datos iniciales:', error)
    }
  }, [])

  const simulateLoading = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  const handleSelectCollection = async (id: string) => {
    console.log('📁 Seleccionando colección:', id)
    try {
      await simulateLoading()
      const collection = mockCollections.find(c => c.id === id)
      if (!collection) {
        console.warn('⚠️ Colección no encontrada:', id)
        return
      }

      const collectionFiles = mockFiles.filter(file =>
        collection.tags.some(tag => file.tags.includes(tag))
      )
      console.log(`✨ Encontrados ${collectionFiles.length} archivos en la colección ${collection.name}`)
      setCurrentPath(['Inicio', 'Colecciones', collection.name])
      setCurrentItems(collectionFiles)
      setCurrentView('files')
    } catch (error) {
      console.error('❌ Error al seleccionar colección:', error)
    }
  }

  const handleSelectFolder = async (id: string) => {
    console.log('📂 Seleccionando carpeta:', id)
    try {
      await simulateLoading()
      const folder = mockFolders.find(f => f.id === id)
      if (!folder) {
        console.warn('⚠️ Carpeta no encontrada:', id)
        return
      }

      const folderFiles = mockFiles.filter(file =>
        file.path.startsWith(`/${folder.name}/`)
      )
      console.log(`📑 Encontrados ${folderFiles.length} archivos en la carpeta ${folder.name}`)
      setCurrentPath(['Inicio', 'Carpetas', folder.name])
      setCurrentItems(folderFiles)
      setCurrentView('files')
    } catch (error) {
      console.error('❌ Error al seleccionar carpeta:', error)
    }
  }

  const handleSelectTag = async (name: string) => {
    console.log('🏷️ Seleccionando etiqueta:', name)
    try {
      await simulateLoading()
      const tag = mockTags.find(t => t.name === name)
      if (!tag) {
        console.warn('⚠️ Etiqueta no encontrada:', name)
        return
      }

      const tagFiles = mockFiles.filter(file =>
        file.tags.includes(tag.name)
      )
      console.log(`🔍 Encontrados ${tagFiles.length} archivos con la etiqueta ${tag.name}`)
      setCurrentPath(['Inicio', 'Etiquetas', tag.name])
      setCurrentItems(tagFiles)
      setCurrentView('files')
    } catch (error) {
      console.error('❌ Error al seleccionar etiqueta:', error)
    }
  }

  const handleSelectItem = (item: FileItem) => {
    try {
      console.log('🖼️ Seleccionando archivo:', { id: item.id, name: item.name })
      setSelectedItem(item)
    } catch (error) {
      console.error('❌ Error al seleccionar archivo:', error)
    }
  }

  useEffect(() => {
    console.log('🔄 Cambiando vista actual:', currentView)
    try {
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
          // La ruta se maneja en los handlers específicos
          break
        default:
          console.warn('⚠️ Vista no reconocida:', currentView)
      }
    } catch (error) {
      console.error('❌ Error al cambiar la vista:', error)
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