'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileItem } from '@/store/files'
import type { ThumbnailSize } from '@/store/ui'
import { useImageViewer } from '@/store/image-viewer'
import { FileCard } from './file-item'
import { Loader2 } from 'lucide-react'

interface VirtualizedGridProps {
  items: FileItem[]
  thumbnailSize: ThumbnailSize
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
}

const itemVariants = {
  initial: {
    opacity: 0,
    scale: 0.95
  },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      mass: 0.5,
      delay: Math.min(i * 0.025, 0.15)
    }
  })
}

export function VirtualizedGrid({
  items,
  thumbnailSize,
  onSelectItem,
  selectedItem
}: VirtualizedGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isGridReady, setIsGridReady] = useState(false)
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

  const mediaItems = useMemo(() => items.filter(item =>
    (item.mimeType?.startsWith('image/') || item.mimeType?.startsWith('video/')) &&
    (item.url || item.thumbnailUrl)
  ), [items])

  useEffect(() => {
    const element = parentRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    setDimensions({
      width: rect.width,
      height: rect.height
    })

    const timer = setTimeout(() => {
      setIsGridReady(true)
    }, 50)

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timer)
    }
  }, [])

  const layoutConfig = useMemo(() => {
    if (dimensions.width === 0) return {
      columnCount: 1,
      rowCount: 1,
      sidePadding: 0,
      gap: 16,
      itemsPerPage: 2
    }

    const scrollbarWidth = 12
    const availableWidth = dimensions.width - scrollbarWidth
    const minGap = gap

    const columnCount = Math.max(1, Math.floor((availableWidth + minGap) / (itemWidth + minGap)))
    const totalGapSpace = availableWidth - (columnCount * itemWidth)
    const optimalGap = Math.floor(totalGapSpace / (columnCount + 1))
    const contentWidth = (columnCount * itemWidth) + ((columnCount - 1) * optimalGap)
    const sidePadding = Math.floor((availableWidth - contentWidth) / 2)
    const rowCount = Math.ceil(mediaItems.length / columnCount)

    return {
      columnCount,
      rowCount,
      sidePadding,
      gap: optimalGap,
      itemsPerPage: columnCount * 2
    }
  }, [dimensions.width, itemWidth, gap, mediaItems.length])

  const virtualizer = useVirtualizer({
    count: layoutConfig.rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + layoutConfig.gap,
    overscan: layoutConfig.itemsPerPage,
    paddingStart: layoutConfig.gap,
    paddingEnd: layoutConfig.gap
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
        {!isGridReady && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20
              }}
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </motion.div>
          </motion.div>
        )}
        <motion.div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isGridReady ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          {virtualizer.getVirtualItems().map(virtualRow => {
            const rowItems = getItemsForRow(virtualRow.index)
            const rowStartIndex = virtualRow.index * layoutConfig.columnCount

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${itemHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: `0 ${layoutConfig.sidePadding}px`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${layoutConfig.columnCount}, ${itemWidth}px)`,
                  gap: `${layoutConfig.gap}px`,
                  justifyContent: 'center',
                  willChange: 'transform'
                }}
              >
                {rowItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    initial="initial"
                    animate={isGridReady ? "animate" : "initial"}
                    custom={rowStartIndex + index}
                    style={{
                      height: itemHeight,
                      willChange: 'transform, opacity'
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
              </div>
            )
          })}
        </motion.div>
      </div>
    </ScrollArea>
  )
}