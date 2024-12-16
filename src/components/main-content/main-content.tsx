'use client'

import { RightPanel } from "@/components/right-panel/right-panel"
import { LeftSidebar } from '@/components/left-sidebar/LeftSidebar'
import { CardView } from '@/components/card-view/card-view'
import { FileView } from "@/components/file-view/file-view"
import { MainToolbar } from "@/components/main-toolbar/main-toolbar"
import { Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useFilesStore } from "@/store/files"
import { useUIStore } from "@/store/ui"
import type { FileItem } from "@/store/files"

export function MainContent() {
  const {
    currentView,
    currentItems,
    selectedItem,
    collections,
    folders,
    tags,
    setCurrentView,
    setSelectedItem,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    currentPath
  } = useFilesStore()

  const {
    view,
    thumbnailSize,
    zoomLevel,
    isSettingsOpen,
    isRightPanelCollapsed,
    searchQuery,
    navigationHistory,
    currentHistoryIndex,
    sortBy,
    sortOrder,
    setView,
    setZoomLevel,
    toggleSettings,
    toggleRightPanel,
    setSearchQuery,
    navigateBack,
    navigateForward,
    addToHistory,
    setSorting
  } = useUIStore()

  const handleSelectItem = (item: FileItem) => {
    console.log('MainContent: handleSelectItem', item)
    setSelectedItem(item)
    toggleSettings()

    if (item.type === 'folder') {
      addToHistory(item.id)
    }
  }

  const handleBreadcrumbNavigate = (index: number) => {
    if (index === 0) {
      setCurrentView('collections')
      return
    }

    if (index === 1) {
      const section = currentPath[1].toLowerCase()
      if (section.includes('colecciones')) setCurrentView('collections')
      else if (section.includes('carpetas')) setCurrentView('folders')
      else if (section.includes('etiquetas')) setCurrentView('tags')
      return
    }
  }

  const renderContent = () => {
    console.log('MainContent: renderContent', { currentView, view, thumbnailSize })
    switch (currentView) {
      case 'collections':
        return (
          <CardView
            items={collections.map(c => ({
              id: c.id,
              name: c.name,
              description: c.description,
              thumbnails: c.thumbnails,
              count: c.count,
              totalSize: c.totalSize,
              tags: c.tags,
              color: c.color,
              emoji: c.emoji
            }))}
            type="collections"
            onSelect={handleSelectCollection}
          />
        )
      case 'folders':
        return (
          <CardView
            items={folders.map(f => ({
              id: f.id,
              name: f.name,
              description: f.description,
              thumbnails: f.thumbnails,
              count: f.count,
              totalSize: f.totalSize,
              tags: [],
              color: f.color
            }))}
            type="folders"
            onSelect={handleSelectFolder}
          />
        )
      case 'tags':
        return (
          <CardView
            items={tags.map(t => ({
              id: t.id,
              name: t.name,
              description: t.description,
              thumbnails: t.thumbnails,
              count: t.count,
              totalSize: t.totalSize,
              tags: [t.name],
              color: t.color
            }))}
            type="tags"
            onSelect={handleSelectTag}
          />
        )
      case 'files':
        return (
          <FileView
            view={view}
            thumbnailSize={thumbnailSize}
            onSelectItem={handleSelectItem}
            selectedItem={selectedItem}
            items={currentItems}
          />
        )
    }
  }

  return (
    <div className="flex h-full">
      <LeftSidebar />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
      >
        <ResizablePanel
          defaultSize={isRightPanelCollapsed ? 95 : 75}
          minSize={isRightPanelCollapsed ? 90 : 30}
          maxSize={isRightPanelCollapsed ? 95 : 85}
        >
          <div className="flex flex-col h-full">
            <MainToolbar
              view={view}
              onViewChange={setView}
              onZoomIn={() => setZoomLevel(Math.min(zoomLevel + 10, 200))}
              onZoomOut={() => setZoomLevel(Math.max(zoomLevel - 10, 50))}
              onNavigateBack={navigateBack}
              onNavigateForward={navigateForward}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenSettings={() => toggleSettings()}
              canNavigateBack={currentHistoryIndex > 0}
              canNavigateForward={currentHistoryIndex < navigationHistory.length - 1}
              canZoomIn={zoomLevel < 200}
              canZoomOut={zoomLevel > 50}
              className="border-b"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={setSorting}
            />
            {currentPath.length > 0 && (
              <Breadcrumbs
                path={currentPath}
                onNavigate={handleBreadcrumbNavigate}
                className="border-b px-4 py-2"
              />
            )}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto">
                {renderContent()}
              </div>
            </div>
            <footer className="h-8 border-t bg-muted/50 px-4 text-[10px] flex items-center justify-between">
              <div>Ruta: {currentPath.join(' / ')}</div>
              <div>
                {currentItems.length} elementos | Zoom: {zoomLevel}%
              </div>
            </footer>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <RightPanel
          selectedItem={selectedItem}
          isCollapsed={isRightPanelCollapsed}
          showSettings={isSettingsOpen}
          onToggleSettings={toggleSettings}
          onToggleCollapse={toggleRightPanel}
          defaultSize={isRightPanelCollapsed ? 5 : 25}
          minSize={isRightPanelCollapsed ? 5 : 15}
          maxSize={isRightPanelCollapsed ? 5 : 40}
        />
      </ResizablePanelGroup>
    </div>
  )
}
