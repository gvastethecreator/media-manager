'use client'

import { useState } from 'react'
import { LeftSidebar } from "@/components/left-sidebar"
import { MainContent } from "@/components/main-content"
import { RightSidebar } from "@/components/right-sidebar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { SettingsSidebar } from "@/components/settings-sidebar"
import { ProfileContext } from "@/contexts/ProfileContext"
import { SidebarProvider } from "@/components/ui/sidebar"
import { FileItem } from '@/components/file-view'
import { CardItem } from '@/components/card-view'

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

export default function Page() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState('folders')
  const [currentUser, setCurrentUser] = useState({
    name: "John Doe",
    totalImages: 1234,
    avatar: "/avatars/01.png"
  })
  const [collections, setCollections] = useState(placeholderData.collections)
  const [folders, setFolders] = useState(placeholderData.folders)
  const [tags, setTags] = useState(placeholderData.tags)
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState<'files' | 'collections' | 'folders' | 'tags'>('files')

  const openProfileSettings = () => {
    setIsSettingsOpen(true)
    setActiveSettingsTab('profiles')
  }

  const openSettingsTab = (tab: string) => {
    setIsSettingsOpen(true)
    setActiveSettingsTab(tab)
  }

  return (
    <ProfileContext.Provider value={{ 
      currentUser, 
      openProfileSettings, 
      openSettingsTab,
      collections,
      folders,
      tags,
      setCurrentView 
    }}>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <LeftSidebar />
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={75} minSize={30}>
              <MainContent 
                onOpenSettings={() => setIsSettingsOpen(true)}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                currentView={currentView}
                setCurrentView={setCurrentView}
                items={currentView === 'collections' ? collections : 
                       currentView === 'folders' ? folders :
                       currentView === 'tags' ? tags : []}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} collapsible={true}>
              <RightSidebar selectedItem={selectedItem} isCollapsed={isRightSidebarCollapsed} />
            </ResizablePanel>
          </ResizablePanelGroup>
          <SettingsSidebar 
            isOpen={isSettingsOpen} 
            onOpenChange={setIsSettingsOpen}
            activeTab={activeSettingsTab}
            onTabChange={setActiveSettingsTab}
          />
        </div>
      </SidebarProvider>
    </ProfileContext.Provider>
  )
}

