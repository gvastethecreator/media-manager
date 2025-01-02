'use client';

import { useCallback, useEffect } from 'react'
import { useFilesStore } from '@/store/files'
import { useImageViewer } from '@/store/image-viewer'
import { VirtualizedView } from '@/components/features/file-management/file-grid/components/virtualized-view'
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state'
import { FolderIcon, Loader2 } from 'lucide-react'
import type { FileItem } from '@/types/file-item'

export function FolderContentView() {
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
  const { openViewer } = useImageViewer()

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
          <div className="h-full w-full overflow-auto">
            <VirtualizedView
              items={items}
              selectedItem={selectedItem}
              selectedIds={selectedIds}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              isLoading={storeLoading}
            />
          </div>
    </div>
  )
}