'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, usePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileItem } from '@/store/files'
import type { ThumbnailSize } from '@/store/ui'
import { useImageViewer } from '@/store/image-viewer'
import { FileCard } from './file-item'
import { Loader2 } from 'lucide-react'
import type { Column } from '../file-browser'
import { useWindowSize } from '@/hooks/use-window-size'

interface VirtualizedViewProps {
  items: FileItem[]
  viewMode: 'grid' | 'list'
  thumbnailSize: ThumbnailSize
  selectedItem: FileItem | null
  selectedIds: string[]
  onItemClick: (item: FileItem) => void
  onItemDoubleClick: (item: FileItem) => void
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
  viewMode,
  thumbnailSize,
  selectedItem,
  selectedIds,
  onItemClick,
  onItemDoubleClick,
  columns
}: VirtualizedViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [isPresent] = usePresence()
  const { width: windowWidth } = useWindowSize()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isViewReady, setIsViewReady] = useState(false)
  const { openViewer } = useImageViewer()

  useEffect(() => {
    const updateDimensions = () => {
      if (!parentRef.current) return
      const rect = parentRef.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height
      })
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current)
      updateDimensions()
    }

    const timer = setTimeout(() => {
      updateDimensions()
      setIsViewReady(true)
    }, 100)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timer)
    }
  }, [])

  const { gridItemWidth, gridItemHeight, columnCount, rowCount } = useMemo(() => {
    if (dimensions.width === 0) return {
      gridItemWidth: 200,
      gridItemHeight: 200,
      columnCount: 1,
      rowCount: items.length
    }

    const gap = 16
    const minPadding = 16
    const availableWidth = dimensions.width - (minPadding * 2)

    const getBaseSize = () => {
      if (viewMode === 'list') return availableWidth
      switch (thumbnailSize) {
        case 'small': return 160
        case 'large': return 240
        default: return 200
      }
    }
    
    const baseSize = getBaseSize()
    const baseHeight = viewMode === 'grid' ? baseSize + 32 : 48

    if (viewMode === 'list') {
      return {
        gridItemWidth: availableWidth,
        gridItemHeight: baseHeight,
        columnCount: 1,
        rowCount: items.length
      }
    }

    const maxColumns = Math.max(1, Math.floor((availableWidth + gap) / (baseSize + gap)))
    const totalGapWidth = (maxColumns - 1) * gap
    const adjustedWidth = Math.floor((availableWidth - totalGapWidth) / maxColumns)

    return {
      gridItemWidth: adjustedWidth,
      gridItemHeight: baseHeight,
      columnCount: maxColumns,
      rowCount: Math.ceil(items.length / maxColumns)
    }
  }, [dimensions.width, viewMode, thumbnailSize, items.length])

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => gridItemHeight + 16,
    overscan: 5
  })

  const getItemsForRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * columnCount
    const endIndex = Math.min(startIndex + columnCount, items.length)
    return items.slice(startIndex, endIndex)
  }, [columnCount, items])

  const itemContent = useCallback((index: number) => {
    const item = items[index]
    return (
      <FileCard
        key={item.id}
        item={item}
        viewMode={viewMode}
        thumbnailSize={thumbnailSize}
        isSelected={selectedIds.includes(item.id)}
        onClick={() => onItemClick(item)}
        onDoubleClick={() => onItemDoubleClick(item)}
      />
    )
  }, [items, viewMode, thumbnailSize, selectedIds, onItemClick, onItemDoubleClick])

  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (item.type === 'image') {
      openViewer(item, items)
    }
  }, [openViewer, items])

  return (
    <ScrollArea className="h-full w-full">
      <div
        ref={parentRef}
        className="h-full w-full relative px-4"
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
            const rowStartIndex = virtualRow.index * columnCount

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${gridItemHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: viewMode === 'grid'
                    ? `repeat(${columnCount}, ${gridItemWidth}px)`
                    : '1fr',
                  gap: '16px',
                  justifyContent: 'center',
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
                      height: gridItemHeight,
                      width: '100%',
                      willChange: 'transform, opacity'
                    }}
                  >
                    {itemContent(rowStartIndex + index)}
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