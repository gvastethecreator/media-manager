'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FileItem } from '@/store/files'
import { VirtualizedView } from './components/virtualized-view'
import type { ThumbnailSize } from '@/store/ui'
import { useColumns } from '@/store/columns'
import { useImageViewer } from '@/store/image-viewer'
import { useSelectedItem, useSelectedIds, useFilesStore } from '@/store/files'
import { useState, useCallback } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

export interface Column {
  id: string
  label: string
  width: number
  minWidth?: number
  isResizable?: boolean
  isHideable?: boolean
  isVisible: boolean
  accessor: (item: FileItem) => string | number
}

export const defaultColumns: Column[] = [
  {
    id: 'thumbnail',
    label: '',
    width: 48,
    minWidth: 48,
    isResizable: false,
    isHideable: false,
    isVisible: true,
    accessor: (item: FileItem) => item.thumbnailUrl || ''
  },
  {
    id: 'name',
    label: ' Nombre',
    width: 250,
    minWidth: 120,
    isResizable: true,
    isHideable: false,
    isVisible: true,
    accessor: (item: FileItem) => item.name
  },
  {
    id: 'type',
    label: ' Tipo',
    width: 100,
    minWidth: 80,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.type
  },
  {
    id: 'model',
    label: ' Modelo',
    width: 150,
    minWidth: 100,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.model || ''
  },
  {
    id: 'loras',
    label: ' LoRAs',
    width: 150,
    minWidth: 100,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.loras?.join(', ') || ''
  },
  {
    id: 'source',
    label: ' Fuente',
    width: 120,
    minWidth: 80,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.source || ''
  },
  {
    id: 'date',
    label: ' Fecha',
    width: 150,
    minWidth: 100,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => {
      const date = new Date(item.modified)
      return date.toLocaleDateString()
    }
  }
]

interface FileViewProps {
  items: FileItem[]
  viewMode: 'grid' | 'list' | 'details'
  thumbnailSize: ThumbnailSize
  onItemSelect: (item: FileItem | null) => void
  isResizing: boolean
}

const variants = {
  grid: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 }
  },
  list: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 }
  }
}

export function FileBrowser() {
  const { items, selectedItem, selectedIds, selectItem } = useFilesStore()
  const { viewMode, thumbnailSize } = useColumns()
  const [showSettings, setShowSettings] = useState(false)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const handleItemClick = useCallback((item: FileItem) => {
    selectItem(item)
  }, [selectItem])

  const handleResizeStart = useCallback(() => {
    if (!isResizing) {
      console.log('resize start')
      setIsResizing(true)
    }
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      console.log('resize end')
      setIsResizing(false)
    }
  }, [isResizing])

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
              isResizing={isResizing}
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

export function FileView({ items, viewMode = "grid", thumbnailSize, onItemSelect, isResizing }: FileViewProps) {
  const { columns } = useColumns()
  const selectedItem = useSelectedItem()
  const selectedIds = useSelectedIds()
  const { selectItem, deselectItem } = useFilesStore()
  const { openViewer } = useImageViewer()

  const handleItemClick = React.useCallback((item: FileItem) => {
    if (selectedIds.includes(item.id)) {
      deselectItem(item.id)
      onItemSelect(null)
    } else {
      selectItem(item.id)
      onItemSelect(item)
    }
  }, [onItemSelect, selectedIds, selectItem, deselectItem])

  const handleItemDoubleClick = React.useCallback((item: FileItem) => {
    if (item.type === 'image' || (item.mimeType?.startsWith('image/'))) {
      // Filtramos solo las imágenes del array de items
      const imageItems = items.filter(i =>
        i.type === 'image' || i.mimeType?.startsWith('image/')
      )
      openViewer(item, imageItems)
    }
  }, [openViewer, items])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="h-full w-full"
        >
          <VirtualizedView
            items={items}
            viewMode={viewMode}
            thumbnailSize={thumbnailSize}
            onItemClick={handleItemClick}
            onItemDoubleClick={handleItemDoubleClick}
            selectedItem={selectedItem}
            selectedIds={selectedIds}
            columns={columns}
            isResizing={isResizing}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
