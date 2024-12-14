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
  const [currentView, setCurrentView] = React.useState<ViewMode>('collections')
  const [currentItems, setCurrentItems] = React.useState<FileItem[]>([])
  const [selectedItem, setSelectedItem] = React.useState<FileItem | null>(null)
  const [view, setView] = React.useState<'grid' | 'list' | 'details'>('grid')
  const [thumbnailSize, setThumbnailSize] = React.useState<'small' | 'medium' | 'large'>('medium')
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentPath, setCurrentPath] = React.useState<string[]>(['Home'])

  const handleSelectCollection = async (id: string) => {
    setIsLoading(true)
    try {
      const collection = collections.find(c => c.id === id)
      if (collection) {
        setCurrentPath(['Home', 'Collections', collection.name])
        setCurrentItems(sampleViewData.collections[id] || [])
        setCurrentView('files')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectFolder = async (id: string) => {
    setIsLoading(true)
    try {
      const folder = folders.find(f => f.id === id)
      if (folder) {
        setCurrentPath(['Home', 'Folders', folder.name])
        setCurrentItems(sampleViewData.folders[id] || [])
        setCurrentView('files')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTag = async (name: string) => {
    setIsLoading(true)
    try {
      const tag = tags.find(t => t.name === name)
      if (tag) {
        setCurrentPath(['Home', 'Tags', tag.name])
        setCurrentItems(sampleViewData.tags[name] || [])
        setCurrentView('files')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectItem = (item: FileItem) => {
    setSelectedItem(item)
  }

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
    throw new Error('useFiles must be used within a FilesProvider')
  }
  return context
}