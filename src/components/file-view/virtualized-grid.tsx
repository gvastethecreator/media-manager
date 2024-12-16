'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileItem } from '@/store/files'
import type { ThumbnailSize } from '@/store/ui'
import { useImageViewer } from '@/store/image-viewer'
import { FileCard } from './file-card'

interface VirtualizedGridProps {
  items: FileItem[]
  thumbnailSize: ThumbnailSize
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
}

const itemVariants = {
  initial: {
    scale: 0.8,
    opacity: 0,
    y: 20
  },
  enter: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1]
    }
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1]
    }
  }
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
        return { width: 140, height: 140, gap: 12 }
      case 'large':
        return { width: 280, height: 280, gap: 20 }
      default:
        return { width: 200, height: 200, gap: 16 }
    }
  }, [thumbnailSize])

  const { width: itemWidth, height: itemHeight, gap } = useMemo(() =>
    getThumbnailDimensions(),
    [getThumbnailDimensions]
  )

  const padding = useMemo(() => gap, [gap])

  const mediaItems = useMemo(() => items.filter(item =>
    (item.mimeType?.startsWith('image/') || item.mimeType?.startsWith('video/')) &&
    (item.url || item.thumbnailUrl)
  ), [items])

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

  const layoutConfig = useMemo(() => {
    const availableWidth = dimensions.width - (padding * 2)
    const columnCount = Math.max(1, Math.floor((availableWidth + gap) / (itemWidth + gap)))
    const rowCount = Math.ceil(mediaItems.length / columnCount)
    const totalItemsWidth = columnCount * itemWidth + (columnCount - 1) * gap
    const extraSpace = Math.max(0, availableWidth - totalItemsWidth)
    const sidePadding = Math.max(padding, padding + (extraSpace / 2))

    return {
      columnCount,
      rowCount,
      sidePadding,
      itemsPerPage: columnCount * 3 // Precarga 3 filas
    }
  }, [dimensions.width, padding, gap, itemWidth, mediaItems.length])

  const virtualizer = useVirtualizer({
    count: layoutConfig.rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan: layoutConfig.itemsPerPage,
    scrollMargin: padding
  })

  const getItemsForRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * layoutConfig.columnCount
    const endIndex = Math.min(startIndex + layoutConfig.columnCount, mediaItems.length)
    return mediaItems.slice(startIndex, endIndex)
  }, [layoutConfig.columnCount, mediaItems])

  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (item.mimeType?.startsWith('image/') || item.mimeType?.startsWith('video/')) {
      const currentIndex = mediaItems.findIndex(i => i.id === item.id)
      if (currentIndex !== -1) {
        openViewer(item, mediaItems)
      }
    }
  }, [openViewer, mediaItems])

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
            padding: `${padding}px ${layoutConfig.sidePadding}px`
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {virtualizer.getVirtualItems().map(virtualRow => {
              const rowItems = getItemsForRow(virtualRow.index)

              return (
                <motion.div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${layoutConfig.columnCount}, minmax(0, ${itemWidth}px))`,
                    gap: `${gap}px`,
                    justifyContent: 'center',
                    padding: `0 ${gap/2}px`
                  }}
                >
                  {rowItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      custom={index}
                      transition={{
                        delay: index * 0.05
                      }}
                    >
                      <FileCard
                        item={item}
                        width={itemWidth}
                        height={itemHeight}
                        isSelected={selectedItem?.id === item.id}
                        onSelect={onSelectItem}
                        onDoubleClick={handleItemDoubleClick}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  )
}