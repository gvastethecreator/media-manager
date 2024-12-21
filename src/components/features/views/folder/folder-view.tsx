'use client';

import { useEffect } from 'react'
import { useFilesStore } from '@/store/files'
import { VirtualizedView } from '@/components/features/file-management/file-browser/components/virtualized-view'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileImage } from 'lucide-react'
import { useImageViewer } from '@/store/image-viewer'
import { useUIStore } from '@/store/ui'

export function FolderView() {
  const { currentItems, isLoading, currentFolderId, selectItem, selectedIds } = useFilesStore()
  const { openViewer } = useImageViewer()
  const { zoomLevel } = useUIStore()

  // Convertir el nivel de zoom a un tamaño de thumbnail
  const thumbnailSize = zoomLevel <= 50 ? 'small' : zoomLevel <= 100 ? 'medium' : 'large'

  console.log('FolderView - currentItems:', currentItems.length)
  console.log('FolderView - isLoading:', isLoading)
  console.log('FolderView - currentFolderId:', currentFolderId)

  if (!currentFolderId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <FileImage className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No hay carpeta seleccionada</h2>
        <p className="text-muted-foreground">
          Selecciona una carpeta para ver su contenido
        </p>
      </div>
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
      <div className="flex flex-col items-center justify-center h-full p-4">
        <FileImage className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Carpeta vacía</h2>
        <p className="text-muted-foreground">
          Esta carpeta no contiene imágenes
        </p>
      </div>
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
