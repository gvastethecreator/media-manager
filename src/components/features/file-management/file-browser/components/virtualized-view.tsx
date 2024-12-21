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
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
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

// Constantes para el layout
const GAP = 15
const CONTAINER_PADDING = 15

// Hook personalizado para manejar la carga infinita
function useInfiniteLoader(
  hasMore: boolean | undefined,
  isLoading: boolean | undefined,
  onLoadMore: (() => void) | undefined,
  currentIndex: number,
  totalRows: number
) {
  useEffect(() => {
    if (
      hasMore &&
      !isLoading &&
      onLoadMore &&
      currentIndex > totalRows - 3
    ) {
      onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore, currentIndex, totalRows])
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
  isResizing,
  hasMore,
  isLoading,
  onLoadMore
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

    const availableWidth = dimensions.width - (CONTAINER_PADDING * 2)

    const getBaseSize = () => {
      if (viewMode === 'list') return availableWidth

      const baseSizes = {
        small: 150,
        medium: 190,
        large: 230
      }

      const baseSize = baseSizes[thumbnailSize]

      // Calculamos cuántas columnas caben con el tamaño exacto
      const maxColumns = Math.floor((availableWidth + GAP) / (baseSize + GAP))
      const totalGaps = (maxColumns - 1) * GAP
      const itemWidth = Math.floor((availableWidth - totalGaps) / maxColumns)

      // Nos aseguramos que el tamaño esté dentro de los límites (±20%)
      const minSize = baseSize * 0.8
      const maxSize = baseSize * 1.2

      if (itemWidth < minSize) {
        const reducedColumns = maxColumns - 1
        const reducedGaps = (reducedColumns - 1) * GAP
        return Math.floor((availableWidth - reducedGaps) / reducedColumns)
      }

      if (itemWidth > maxSize) {
        const increasedColumns = maxColumns + 1
        const increasedGaps = (increasedColumns - 1) * GAP
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
    const maxColumns = Math.floor((availableWidth + GAP) / (itemWidth + GAP))

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
    estimateSize: useCallback(() => gridItemHeight + GAP, [gridItemHeight]),
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

  const lastVisibleRowIndex = useMemo(() => {
    const virtualItems = virtualizer.getVirtualItems()
    return virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : 0
  }, [virtualizer.getVirtualItems()])

  // Usar el hook personalizado fuera del map
  useInfiniteLoader(hasMore, isLoading, onLoadMore, lastVisibleRowIndex, rowCount)

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
                    gap: `${GAP}px`,
                    justifyContent: 'start',
                    alignItems: 'start',
                    willChange: 'transform',
                    contain: 'layout style paint',
                    marginBottom: viewMode === 'grid' ? `${GAP}px` : undefined
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
                          ? `${(gridItemHeight * item.gridInfo.rowSpan) + (GAP * (item.gridInfo.rowSpan - 1))}px`
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
            {isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </motion.div>
        )}
      </div>
    </ScrollArea>
  )
}