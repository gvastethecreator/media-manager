'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, usePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileItem } from '@/types/file-item'
import type { ThumbnailSize } from '@/types/ui'
import { useImageViewer } from '@/store/image-viewer'
import { FileCard } from './file-item'
import { Loader2 } from 'lucide-react'
import type { Column } from '../file-browser'
import { useWindowSize } from '@/hooks/use-window-size'
import { cn } from '@/lib/utils'

interface VirtualizedViewProps {
  items: FileItem[]
  viewMode: 'grid' | 'list'
  thumbnailSize: ThumbnailSize
  selectedItem: FileItem | null
  selectedIds: string[]
  onItemClick: (item: FileItem) => void
  onItemDoubleClick: (item: FileItem) => void
  columns?: Column[]
  isResizing?: boolean
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
  columns,
  isResizing
}: VirtualizedViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [isPresent] = usePresence()
  const { width: windowWidth } = useWindowSize()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isViewReady, setIsViewReady] = useState(false)
  const { openViewer } = useImageViewer()

  // Congelamos todos los cálculos durante el resize
  const { gridItemWidth, gridItemHeight, columnCount, rowCount } = useMemo(() => {
    // Si está resizing, mantenemos los valores anteriores
    if (isResizing) {
      return {
        gridItemWidth: dimensions.width || 200,
        gridItemHeight: dimensions.width || 200,
        columnCount: Math.floor((dimensions.width || 800) / 200),
        rowCount: Math.ceil((items?.length || 0) / Math.floor((dimensions.width || 800) / 200))
      }
    }

    if (dimensions.width === 0) return {
      gridItemWidth: 200,
      gridItemHeight: 200,
      columnCount: 1,
      rowCount: items?.length || 0
    }

    const gap = 15
    const containerPadding = 15
    const availableWidth = dimensions.width - (containerPadding * 2)

    const getBaseSize = () => {
      if (viewMode === 'list') return availableWidth

      const baseSizes = {
        small: 150,
        medium: 190,
        large: 230
      }

      const baseSize = baseSizes[thumbnailSize]
      
      // Calculamos cuántas columnas caben con el tamaño exacto
      const maxColumns = Math.floor((availableWidth + gap) / (baseSize + gap))
      const totalGaps = (maxColumns - 1) * gap
      const itemWidth = Math.floor((availableWidth - totalGaps) / maxColumns)
      
      // Nos aseguramos que el tamaño esté dentro de los límites (±20%)
      const minSize = baseSize * 0.8
      const maxSize = baseSize * 1.2
      
      if (itemWidth < minSize) {
        const reducedColumns = maxColumns - 1
        const reducedGaps = (reducedColumns - 1) * gap
        return Math.floor((availableWidth - reducedGaps) / reducedColumns)
      }
      
      if (itemWidth > maxSize) {
        const increasedColumns = maxColumns + 1
        const increasedGaps = (increasedColumns - 1) * gap
        return Math.floor((availableWidth - increasedGaps) / increasedColumns)
      }
      
      return itemWidth
    }

    const itemWidth = getBaseSize()
    
    // Calculamos la altura base y agregamos el espacio para el título
    const baseHeight = viewMode === 'grid' ? itemWidth : 48

    if (viewMode === 'list') {
      return {
        gridItemWidth: availableWidth,
        gridItemHeight: baseHeight,
        columnCount: 1,
        rowCount: items?.length || 0
      }
    }

    // Calculamos el número exacto de columnas que caben
    const maxColumns = Math.floor((availableWidth + gap) / (itemWidth + gap))

    return {
      gridItemWidth: itemWidth,
      gridItemHeight: baseHeight,
      columnCount: maxColumns,
      rowCount: Math.ceil((items?.length || 0) / maxColumns)
    }
  }, [dimensions.width, viewMode, thumbnailSize, items, isResizing])

  // Desactivamos el ResizeObserver durante el resize y actualizamos isViewReady
  useEffect(() => {
    if (isResizing || !parentRef.current) {
      setIsViewReady(false)
      return
    }

    const updateDimensions = () => {
      if (!parentRef.current) return
      const rect = parentRef.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height
      })
      // Una vez que tenemos las dimensiones, la vista está lista
      setIsViewReady(true)
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(parentRef.current)
    updateDimensions()

    return () => {
      resizeObserver.disconnect()
    }
  }, [isResizing])

  // Congelamos el virtualizer durante el resize
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => gridItemHeight + 15, [gridItemHeight]),
    overscan: 3,
    scrollingDelay: isResizing ? 1000 : 50 // Aumentamos el delay durante el resize
  })

  const getItemsForRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * columnCount
    const endIndex = Math.min(startIndex + columnCount, items?.length || 0)
    return items?.slice(startIndex, endIndex) || []
  }, [columnCount, items])

  const itemContent = useCallback((index: number) => {
    const item = items?.[index]
    return (
      <FileCard
        key={item?.id}
        item={item}
        viewMode={viewMode}
        thumbnailSize={thumbnailSize}
        isSelected={selectedIds.includes(item?.id)}
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
        className="h-full w-full relative px-[15px]"
      >
        {(isResizing || !isViewReady) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-background z-10"
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
        {!isResizing && isViewReady && (
          <motion.div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                    gap: '15px',
                    justifyContent: 'start',
                    alignItems: 'start',
                    willChange: 'transform',
                    contain: 'layout style paint',
                    marginBottom: viewMode === 'grid' ? '15px' : undefined
                  }}
                >
                  {rowItems.map((item, index) => (
                    <motion.div
                      key={item?.id}
                      variants={itemVariants}
                      initial="initial"
                      animate="animate"
                      custom={rowStartIndex + index}
                      style={{
                        height: item?.gridInfo?.rowSpan 
                          ? `${(gridItemHeight * item.gridInfo.rowSpan) + (gap * (item.gridInfo.rowSpan - 1))}px`
                          : gridItemHeight,
                        gridColumn: item?.gridInfo?.colSpan 
                          ? `span ${item.gridInfo.colSpan}`
                          : undefined,
                        gridRow: item?.gridInfo?.rowSpan 
                          ? `span ${item.gridInfo.rowSpan}`
                          : undefined,
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
        )}
      </div>
    </ScrollArea>
  )
}