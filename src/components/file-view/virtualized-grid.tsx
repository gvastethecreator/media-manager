'use client'

import { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, AnimatePresence } from 'framer-motion'
import type { FileItem } from '@/store/files'
import type { ThumbnailSize } from '@/store/ui'
import { cn } from '@/lib/utils'

interface VirtualizedGridProps {
  items: FileItem[]
  thumbnailSize: ThumbnailSize
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
}

export function VirtualizedGrid({
  items,
  thumbnailSize,
  onSelectItem,
  selectedItem
}: VirtualizedGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Calcular tamaños basados en thumbnailSize
  const getThumbnailDimensions = () => {
    switch (thumbnailSize) {
      case 'small':
        return { width: 160, height: 160 }
      case 'large':
        return { width: 320, height: 320 }
      default:
        return { width: 240, height: 240 }
    }
  }

  const { width: itemWidth, height: itemHeight } = getThumbnailDimensions()
  const gap = 16 // Gap entre items
  const padding = 16 // Padding del contenedor

  useEffect(() => {
    if (parentRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0]
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      })

      resizeObserver.observe(parentRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [])

  // Calcular número de columnas basado en el ancho del contenedor
  const availableWidth = dimensions.width - (padding * 2)
  const columnCount = Math.max(1, Math.floor((availableWidth + gap) / (itemWidth + gap)))
  const rowCount = Math.ceil(items.length / columnCount)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan: 5
  })

  const getItemsForRow = (rowIndex: number) => {
    const startIndex = rowIndex * columnCount
    const endIndex = Math.min(startIndex + columnCount, items.length)
    return items.slice(startIndex, endIndex)
  }

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
            const rowItems = getItemsForRow(virtualRow.index)

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  gap: `${gap}px`,
                  padding: `0 ${gap}px`,
                  marginBottom: gap
                }}
              >
                {rowItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    className={cn(
                      "group relative aspect-square rounded-lg border bg-card hover:bg-accent cursor-pointer",
                      selectedItem?.id === item.id && "ring-2 ring-primary"
                    )}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onSelectItem(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.thumbnailUrl ? (
                      <div className="aspect-square w-full overflow-hidden rounded-lg">
                        <motion.img
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full flex items-center justify-center bg-muted rounded-lg">
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <motion.div
                      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 rounded-b-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {item.name}
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}