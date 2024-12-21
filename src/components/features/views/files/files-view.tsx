'use client';

import { useCallback, useState, useEffect } from 'react'
import { useFilesStore } from '@/store/files'
import { useColumns } from '@/store/columns'
import { useImageViewer } from '@/store/image-viewer'
import { VirtualizedView } from '@/components/features/file-management/file-browser/components/virtualized-view'
import { RightPanel } from '@/components/features/file-management/file-details/right-panel'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state'
import { FolderIcon, Loader2 } from 'lucide-react'
import type { FileItem } from '@/types/file-item'

export function FilesView() {
  const {
    currentItems: items,
    selectedItem,
    selectedIds,
    selectItem,
    currentFolderId,
    handleSelectFolder,
    deselectItem,
    isLoading: storeLoading
  } = useFilesStore()
  const { viewMode, thumbnailSize } = useColumns()
  const { openViewer } = useImageViewer()
  const [showSettings, setShowSettings] = useState(false)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (currentFolderId) {
      handleSelectFolder(currentFolderId)
    }
  }, [currentFolderId, handleSelectFolder])

  const handleItemClick = useCallback((item: FileItem) => {
    if (selectedIds.includes(item.id)) {
      deselectItem(item.id)
    } else {
      selectItem(item)
    }
  }, [selectItem, deselectItem, selectedIds])

  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (item.type === 'image' || (item.mimeType?.startsWith('image/'))) {
      const imageItems = (items || []).filter(i =>
        i.type === 'image' || i.mimeType?.startsWith('image/')
      )
      openViewer(item, imageItems)
    }
  }, [openViewer, items])

  const handleResizeStart = useCallback(() => {
    if (!isResizing) {
      setIsResizing(true)
    }
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false)
    }
  }, [isResizing])

  // Si no hay una carpeta seleccionada, mostramos el estado vacío
  if (!currentFolderId) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="No hay carpeta seleccionada"
        description="Selecciona una carpeta del panel izquierdo para ver su contenido"
      />
    )
  }

  // Mostramos el estado de carga
  if (storeLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Si la carpeta está vacía, mostramos el estado vacío
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="Carpeta vacía"
        description="Esta carpeta no contiene archivos"
      />
    )
  }

  return (
    <div className="h-full w-full flex overflow-hidden">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
      >
        <ResizablePanel defaultSize={75} minSize={30} className="h-full">
          <div className="h-full w-full overflow-auto">
            <VirtualizedView
              items={items}
              viewMode={viewMode}
              thumbnailSize={thumbnailSize}
              selectedItem={selectedItem}
              selectedIds={selectedIds}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              isResizing={isResizing}
              hasMore={false}
              isLoading={storeLoading}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle onDragStart={handleResizeStart} onDragEnd={handleResizeEnd} />
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="h-full">
          <RightPanel
            selectedItem={selectedItem}
            isCollapsed={isRightPanelCollapsed}
            showSettings={showSettings}
            onToggleSettings={() => setShowSettings(!showSettings)}
            onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            isResizing={isResizing}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}