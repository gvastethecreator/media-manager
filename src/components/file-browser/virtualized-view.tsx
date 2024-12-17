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
import type { Column } from './file-browser'

interface VirtualizedViewProps {
  items: FileItem[]
  view: 'grid' | 'list' | 'details'
  thumbnailSize: ThumbnailSize
  selectedItem: FileItem | null
  onSelectItem: (item: FileItem) => void
  columns?: Column[]
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

export function VirtualizedView({
  items,
  view,
  thumbnailSize,
  selectedItem,
  onSelectItem,
  columns
}: VirtualizedViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isViewReady, setIsViewReady] = useState(false)
  const { openViewer } = useImageViewer()

  const getThumbnailDimensions = useCallback(() => {
    if (view === 'list' || view === 'details') {
      return { width: dimensions.width, height: 48, gap: 0 }
    }

    switch (thumbnailSize) {
      case 'small':
        return { width: 140, height: 140, gap: 12 }
      case 'large':
        return { width: 280, height: 280, gap: 20 }
      default:
        return { width: 200, height: 200, gap: 16 }
    }
  }, [thumbnailSize, view, dimensions.width])

  const { width: itemWidth, height: itemHeight, gap } = useMemo(() =>
    getThumbnailDimensions(),
    [getThumbnailDimensions]
  )

  useEffect(() => {
    const element = parentRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    setDimensions({
      width: rect.width,
      height: rect.height
    })

    const timer = setTimeout(() => {
      setIsViewReady(true)
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

    if (view === 'list' || view === 'details') {
      return {
        columnCount: 1,
        rowCount: items.length,
        sidePadding: 0,
        gap: 0,
        itemsPerPage: Math.ceil(dimensions.height / itemHeight) + 2
      }
    }

    const minGap = gap
    const columnCount = Math.max(1, Math.floor((availableWidth + minGap) / (itemWidth + minGap)))
    const totalGapSpace = availableWidth - (columnCount * itemWidth)
    const optimalGap = Math.floor(totalGapSpace / (columnCount + 1))
    const contentWidth = (columnCount * itemWidth) + ((columnCount - 1) * optimalGap)
    const sidePadding = Math.floor((availableWidth - contentWidth) / 2)
    const rowCount = Math.ceil(items.length / columnCount)

    return {
      columnCount,
      rowCount,
      sidePadding,
      gap: optimalGap,
      itemsPerPage: columnCount * 2
    }
  }, [dimensions, itemWidth, itemHeight, gap, items.length, view])

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
    const endIndex = Math.min(startIndex + layoutConfig.columnCount, items.length)
    return items.slice(startIndex, endIndex)
  }, [layoutConfig.columnCount, items])

  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (item.type === 'image') {
      openViewer(item, items)
    }
  }, [openViewer, items])

  return (
    <ScrollArea className="h-full w-full">
      <div
        ref={parentRef}
        className="h-full relative"
      >
        {!isViewReady && (
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
          animate={{ opacity: isViewReady ? 1 : 0 }}
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
                  gridTemplateColumns: view === 'grid'
                    ? `repeat(${layoutConfig.columnCount}, ${itemWidth}px)`
                    : '1fr',
                  gap: `${layoutConfig.gap}px`,
                  justifyContent: view === 'grid' ? 'center' : 'start',
                  willChange: 'transform'
                }}
              >
                {rowItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    initial="initial"
                    animate={isViewReady ? "animate" : "initial"}
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