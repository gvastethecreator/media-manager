'use client';

import { useEffect } from 'react'
import { useFilesStore } from '@/store/files'
import { VirtualizedView } from '@/components/features/file-management/file-browser/components/virtualized-view'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileImage } from 'lucide-react'
import { useImageViewer } from '@/store/image-viewer'
import { useUIStore } from '@/store/ui'
import { useNavigationStore } from '@/store/navigation'
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state'

export function FilesView() {
  const {
    currentItems,
    isLoading,
    currentFolderId,
    selectItem,
    selectedIds,
    handleSelectFolder
  } = useFilesStore()
  const { openViewer } = useImageViewer()
  const { zoomLevel } = useUIStore()
  const { currentView } = useNavigationStore()

  // Inicializar los archivos cuando se monta el componente o cambia el folderId
  useEffect(() => {
    console.log('FilesView - currentFolderId:', currentFolderId)
    if (currentFolderId) {
      handleSelectFolder(currentFolderId)
    }
  }, [currentFolderId, handleSelectFolder])

  // Convertir el nivel de zoom a un tamaño de thumbnail
  const thumbnailSize = zoomLevel <= 50 ? 'small' : zoomLevel <= 100 ? 'medium' : 'large'

  if (!currentFolderId) {
    return (
      <EmptyState
        icon={FileImage}
        title="No hay carpeta seleccionada"
        description="Selecciona una carpeta para ver su contenido"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    )
  }

  if (currentItems.length === 0) {
    return (
      <EmptyState
        icon={FileImage}
        title="Carpeta vacía"
        description="Esta carpeta no contiene imágenes"
      />
    )
  }

  const handleItemClick = (item: any) => {
    selectItem(item.id)
  }

  const handleItemDoubleClick = (item: any) => {
    if (item.type === 'image') {
      openViewer(item, currentItems)
    }
  }

  return (
    <ScrollArea className="h-full w-full">
      <VirtualizedView
        items={currentItems}
        viewMode="grid"
        thumbnailSize={thumbnailSize}
        selectedItem={null}
        selectedIds={selectedIds}
        onItemClick={handleItemClick}
        onItemDoubleClick={handleItemDoubleClick}
        loading={isLoading}
        hasMore={false}
      />
    </ScrollArea>
  )
}