'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { FileView } from "@/components/file-view/file-view"
import type { FileItem } from "@/components/file-view/file-view"
import { CardView } from '@/components/card-view/card-view'
import type { CardItem } from '@/components/card-view/card-view'
import { MainToolbar } from '@/components/main-toolbar/MainToolbar'
import { SearchBar } from '@/components/main-toolbar/SearchBar'
import { ActionButtons } from '@/components/main-toolbar/ActionButtons'
import { CompactMenu } from '@/components/main-toolbar/CompactMenu'
import { RightPanel } from '@/components/right-panel/RightPanel'
import { ProfileContext } from "@/contexts/profile-context"
import { LeftSidebar } from '@/components/left-sidebar/LeftSidebar'

const placeholderData: Record<string, CardItem[]> = {
  collections: [
    {
      id: '1',
      name: "Vacaciones 2023",
      description: "Fotos de las vacaciones de verano",
      thumbnails: Array(9).fill("/placeholder.svg"),
      fileCount: 145,
      totalSize: "1.2 GB",
      tags: ["Playa", "Familia"],
      color: "#ff9800",
      emoji: "🏖️"
    },
    {
      id: '2',
      name: "Cumpleaños",
      description: "Celebraciones de cumpleaños",
      thumbnails: Array(9).fill("/placeholder.svg"),
      fileCount: 67,
      totalSize: "500 MB",
      tags: ["Fiesta", "Amigos"],
      color: "#e91e63",
      emoji: "🎂"
    },
  ],
  folders: [
    {
      id: '1',
      name: "Documentos",
      description: "Documentos importantes",
      thumbnails: Array(9).fill("/placeholder.svg"),
      fileCount: 56,
      totalSize: "100 MB",
      tags: ["Personal", "Trabajo"],
      color: "#2196f3"
    },
    {
      id: '2',
      name: "Imágenes",
      description: "Todas las imágenes",
      thumbnails: Array(9).fill("/placeholder.svg"),
      fileCount: 412,
      totalSize: "2.5 GB",
      tags: ["Fotos", "Gráficos"],
      color: "#4caf50"
    },
  ],
  tags: [
    {
      id: '1',
      name: "Favoritos",
      description: "Elementos marcados como favoritos",
      thumbnails: Array(9).fill("/placeholder.svg"),
      fileCount: 50,
      totalSize: "750 MB",
      tags: ["Importante"],
      color: "#f44336"
    },
    {
      id: '2',
      name: "Trabajo",
      description: "Archivos relacionados con el trabajo",
      thumbnails: Array(9).fill("/placeholder.svg"),
      fileCount: 203,
      totalSize: "1.5 GB",
      tags: ["Proyectos", "Clientes"],
      color: "#9c27b0"
    },
  ]
}

export default function MainContent() {
  const [view, setView] = useState<'grid' | 'list' | 'details'>('grid')
  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [isCompact, setIsCompact] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState('profiles')
  const [currentView, setCurrentView] = useState<'files' | 'collections' | 'folders' | 'tags'>('files')
  const [currentUser, setCurrentUser] = useState({
    name: "John Doe",
    totalImages: 1234,
    avatar: "/avatars/01.png"
  })
  const [collections, setCollections] = useState(placeholderData.collections)
  const [folders, setFolders] = useState(placeholderData.folders)
  const [tags, setTags] = useState(placeholderData.tags)

  const handleResize = useCallback(() => {
    const viewportWidth = window.innerWidth
    const rightPanelWidth = document.querySelector('.right-panel')?.clientWidth || 0
    const availableWidth = viewportWidth - rightPanelWidth

    setIsCompact(availableWidth < 768)
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  useEffect(() => {
    const rightPanel = document.querySelector('.right-panel')
    if (rightPanel) {
      const observer = new ResizeObserver(handleResize)
      observer.observe(rightPanel)
      return () => observer.disconnect()
    }
  }, [handleResize])

  const handleSelectItem = (item: FileItem) => {
    setSelectedItem(item)
    setIsSettingsOpen(false)
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
    setSelectedItem(null)
  }

  return (
    <ProfileContext.Provider value={{
      currentUser,
      collections,
      folders,
      tags,
      setCurrentView,
      openProfileSettings: handleOpenSettings,
      openSettingsTab: setActiveSettingsTab
    }}>
      <div className="flex h-full">
        <LeftSidebar />
        <div className="flex-1 flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 lg:px-6">
            <MainToolbar
              view={view}
              setView={setView}
              thumbnailSize={thumbnailSize}
              setThumbnailSize={setThumbnailSize}
              isCompact={isCompact}
            />
            <div className="flex items-center gap-2">
              <SearchBar />
              {!isCompact && <ActionButtons />}
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleOpenSettings}>
                <Settings2 className="h-4 w-4" />
              </Button>
              {isCompact && <CompactMenu setView={setView} setThumbnailSize={setThumbnailSize} />}
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            {currentView === 'files' ? (
              <FileView view={view} thumbnailSize={thumbnailSize} onSelectItem={handleSelectItem} selectedItem={selectedItem} />
            ) : (
              <CardView
                items={currentView === 'collections' ? collections :
                       currentView === 'folders' ? folders :
                       currentView === 'tags' ? tags : []}
                type={currentView}
              />
            )}
          </main>
          <footer className="h-8 shrink-0 border-t bg-muted/50 px-4 text-[10px] flex items-center justify-between">
            <div>Path: / Home / Documents</div>
            <div>5 items | Total size: 8.3 MB | Status: Updated</div>
          </footer>
        </div>
        <RightPanel
          selectedItem={selectedItem}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={() => setIsSettingsOpen(false)}
          activeSettingsTab={activeSettingsTab}
          onTabChange={setActiveSettingsTab}
        />
      </div>
    </ProfileContext.Provider>
  )
}

