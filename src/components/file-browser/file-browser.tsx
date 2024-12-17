'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FileItem } from '@/store/files'
import { VirtualizedView } from './virtualized-view'
import type { ThumbnailSize } from '@/store/ui'
import { useColumns } from '@/store/columns'
import { Image, FileText, Calendar, Scale, Wand2, Layers, Share2, Clock } from 'lucide-react'

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
      const date = new Date(item.date)
      return date.toLocaleDateString()
    }
  }
]

interface FileViewProps {
  items: FileItem[]
  view: 'grid' | 'list' | 'details'
  thumbnailSize: ThumbnailSize
  selectedItems: Set<string>
  onSelectItem: (item: FileItem | string) => void
  columns?: Column[]
  onColumnsChange?: (columns: Column[]) => void
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

export function FileView({
  items,
  view,
  thumbnailSize,
  selectedItems,
  onSelectItem,
  columns = defaultColumns,
  onColumnsChange
}: FileViewProps) {
  const selectedItem = items.find(item => selectedItems.has(item.id)) || null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        className="h-full w-full"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <VirtualizedView
          items={items}
          view={view}
          thumbnailSize={thumbnailSize}
          selectedItem={selectedItem}
          onSelectItem={onSelectItem}
          columns={columns}
        />
      </motion.div>
    </AnimatePresence>
  )
}
