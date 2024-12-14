'use client'

import { useState } from 'react'
import { RightPanel } from "@/components/right-panel/right-panel"
import { LeftSidebar } from '@/components/left-sidebar/LeftSidebar'
import { CardView } from '@/components/card-view/card-view'
import { FileView } from "@/components/file-view/file-view"
import { MainToolbar } from "@/components/main-toolbar/main-toolbar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useFiles } from "@/context/FilesContext"

export default function MainContent() {
  const {
    currentView,
    currentItems,
    selectedItem,
    setSelectedItem
  } = useFiles()

  const [view, setView] = useState<'grid' | 'list' | 'details'>('grid')
  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['/'])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(100)

  const handleSelectItem = (item: FileItem) => {
    setSelectedItem(item)
    setIsSettingsOpen(false)

    if (item.type === 'folder') {
      const newPath = [...navigationHistory.slice(0, currentHistoryIndex + 1), item.id]
      setNavigationHistory(newPath)
      setCurrentHistoryIndex(newPath.length - 1)
    }
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
    setSelectedItem(null)
  }

  const handleNavigateBack = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1)
    }
  }

  const handleNavigateForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 200))
    setThumbnailSize(zoomLevel >= 150 ? 'large' : zoomLevel >= 75 ? 'medium' : 'small')
  }

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 50))
    setThumbnailSize(zoomLevel <= 75 ? 'small' : zoomLevel <= 150 ? 'medium' : 'large')
  }

  const handleToggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed)
  }

  return (
    <>
      <LeftSidebar />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={isRightPanelCollapsed ? 95 : 75}
          minSize={isRightPanelCollapsed ? 90 : 30}
          maxSize={isRightPanelCollapsed ? 95 : 85}
        >
          <div className="flex flex-col h-full">
            <MainToolbar
              view={view}
              onViewChange={setView}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onNavigateBack={handleNavigateBack}
              onNavigateForward={handleNavigateForward}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenSettings={handleOpenSettings}
              canNavigateBack={currentHistoryIndex > 0}
              canNavigateForward={currentHistoryIndex < navigationHistory.length - 1}
              canZoomIn={zoomLevel < 200}
              canZoomOut={zoomLevel > 50}
            />
            <div className="flex-1 overflow-hidden">
              <div className="h-full">
                {view === 'grid' ? (
                  <CardView
                    items={currentItems}
                    type={currentView}
                    selectedItem={selectedItem}
                    onSelectItem={handleSelectItem}
                  />
                ) : (
                  <FileView
                    view={view}
                    thumbnailSize={thumbnailSize}
                    onSelectItem={handleSelectItem}
                    selectedItem={selectedItem}
                    items={currentItems}
                  />
                )}
              </div>
            </div>
            <footer className="h-8 shrink-0 border-t bg-muted/50 px-4 text-[10px] flex items-center justify-between">
              <div>Ruta: {navigationHistory[currentHistoryIndex]}</div>
              <div>
                {currentItems.length} elementos | Tamaño total: {currentItems.reduce((acc, file) => acc + parseInt(file.size), 0)} MB |
                Zoom: {zoomLevel}%
              </div>
            </footer>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <RightPanel
          selectedItem={selectedItem}
          isCollapsed={isRightPanelCollapsed}
          showSettings={isSettingsOpen}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          onToggleCollapse={handleToggleRightPanel}
          defaultSize={isRightPanelCollapsed ? 5 : 25}
          minSize={isRightPanelCollapsed ? 5 : 15}
          maxSize={isRightPanelCollapsed ? 5 : 40}
        />
      </ResizablePanelGroup>
    </>
  )
}
