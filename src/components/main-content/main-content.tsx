'use client'

import { useMemo, useCallback } from 'react'
import { RightPanel } from "@/components/right-panel/right-panel"
import { LeftSidebar } from '@/components/left-sidebar/LeftSidebar'
import { FileView } from "@/components/file-view/file-view"
import { MainToolbar } from "@/components/main-toolbar/main-toolbar"
import { Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useFilesStore } from "@/store/files"
import { useUIStore } from "@/store/ui"
import { EmptyState } from '@/components/empty-state/empty-state'

export function MainContent() {
  const {
    currentView,
    currentItems,
    currentPath,
    selectedItems,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    setCurrentPath,
    sortBy,
    sortOrder,
    setSorting
  } = useFilesStore()

  const {
    view,
    zoomLevel,
    isSettingsOpen,
    isRightPanelCollapsed,
    toggleSettings,
    toggleRightPanel,
    setView,
    setZoomLevel,
    searchQuery,
    setSearchQuery,
    thumbnailSize
  } = useUIStore()

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1))
  }, [currentPath, setCurrentPath])

  const renderContent = useCallback(() => {
    if (currentItems.length === 0) {
      return <EmptyState type={currentView} />
    }

    return (
      <FileView
        items={currentItems}
        view={view}
        thumbnailSize={thumbnailSize}
        selectedItems={selectedItems}
        onSelectItem={(item) => {
          const id = typeof item === 'string' ? item : item.id
          if (selectedItems.has(id)) {
            selectedItems.delete(id)
          } else {
            selectedItems.add(id)
          }
        }}
      />
    )
  }, [currentItems, currentView, view, selectedItems, thumbnailSize])

  const selectedItem = useMemo(() => {
    if (selectedItems.size !== 1) return null
    return currentItems.find(item => selectedItems.has(item.id)) || null
  }, [currentItems, selectedItems])

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
              onOpenSettings={toggleSettings}
              canZoomIn={zoomLevel < 200}
              canZoomOut={zoomLevel > 50}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={setSorting}
              search={searchQuery}
              onSearchChange={setSearchQuery}
            />
            {currentPath.length > 0 && (
              <Breadcrumbs
                segments={currentPath}
                onNavigate={handleBreadcrumbNavigate}
                containerClassName="border-b px-4 py-2"
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
