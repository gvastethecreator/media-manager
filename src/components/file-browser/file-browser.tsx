'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FileItem } from '@/store/files'
import { VirtualizedView } from './virtualized-view'
import type { ThumbnailSize } from '@/store/ui'
import { useColumns } from '@/store/columns'
import { useImageViewer } from '@/store/image-viewer'
import { useSelectedItem, useSelectedIds, useFilesStore } from '@/store/files'

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

export function FileView({ items, viewMode = "grid", thumbnailSize, onItemSelect }: FileViewProps) {
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
      openViewer(item, items)
    }
  }, [openViewer, items])

  return (
    <div className="relative h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="h-full"
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
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
