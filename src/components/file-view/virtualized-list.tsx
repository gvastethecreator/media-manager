'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, AnimatePresence } from 'framer-motion'
import type { FileItem } from '@/store/files'
import { formatFileSize } from '@/lib/utils'
import { FileIcon, FolderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VirtualizedListProps {
  items: FileItem[]
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
}

export function VirtualizedList({
  items,
  onSelectItem,
  selectedItem
}: VirtualizedListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const padding = 16 // Padding del contenedor
  const itemHeight = 56 // Altura de cada item
  const gap = 4 // Espacio entre items

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan: 5
  })

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
          padding: `${padding}px`
        }}
      >
        <AnimatePresence mode="popLayout">
          {virtualizer.getVirtualItems().map(virtualRow => {
            const item = items[virtualRow.index]
            const isSelected = selectedItem?.id === item.id

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${itemHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  marginBottom: `${gap}px`
                }}
              >
                <motion.div
                  layoutId={item.id}
                  className={cn(
                    "flex items-center h-full px-4 gap-4 cursor-pointer rounded-md",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/50"
                  )}
                  onClick={() => onSelectItem(item)}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <motion.div
                    className="flex-shrink-0"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.type === 'folder' ? (
                      <FolderIcon className="h-5 w-5" />
                    ) : (
                      <FileIcon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <motion.div
                    className="flex-grow min-w-0"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <p className="text-sm font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatFileSize(item.size)}
                    </p>
                  </motion.div>
                  <motion.div
                    className="flex-shrink-0 text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                  >
                    {new Date(item.modified).toLocaleDateString()}
                  </motion.div>
                </motion.div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}