'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileItem } from '@/store/files'
import type { ThumbnailSize } from '@/store/ui'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/format'
import { useImageViewer } from '@/store/image-viewer'

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
  const { openViewer } = useImageViewer()

  const getThumbnailDimensions = useCallback(() => {
    switch (thumbnailSize) {
      case 'small':
        return { width: 160, height: 160 }
      case 'large':
        return { width: 320, height: 320 }
      default:
        return { width: 240, height: 240 }
    }
  }, [thumbnailSize])

  const { width: itemWidth, height: itemHeight } = getThumbnailDimensions()
  const gap = 16
  const padding = 16

  useEffect(() => {
    const element = parentRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    })

    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [])

  const availableWidth = dimensions.width - (padding * 2)
  const columnCount = Math.max(1, Math.floor((availableWidth + gap) / (itemWidth + gap)))
  const rowCount = Math.ceil(items.length / columnCount)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan: 5,
    scrollMargin: padding
  })

  const getItemsForRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * columnCount
    const endIndex = Math.min(startIndex + columnCount, items.length)
    return items.slice(startIndex, endIndex)
  }, [columnCount, items])

  const handleItemClick = useCallback((item: FileItem) => {
    onSelectItem(item)
  }, [onSelectItem])

  const handleItemDoubleClick = useCallback((item: FileItem) => {
    openViewer(item)
  }, [openViewer])

  return (
    <ScrollArea className="h-full w-full">
      <div
        ref={parentRef}
        className="h-full relative"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
            padding: `${padding}px`
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
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
                        "group relative aspect-square rounded-lg border bg-card hover:bg-accent cursor-pointer overflow-hidden",
                        selectedItem?.id === item.id && "ring-2 ring-primary"
                      )}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      onClick={() => handleItemClick(item)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.thumbnailUrl ? (
                        <motion.img
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <span className="text-2xl">📄</span>
                        </div>
                      )}
                      <motion.div
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 opacity-0 group-hover:opacity-100"
                        initial={false}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-white/70">
                            {item.extension} • {formatFileSize(item.size)}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  )
}