'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence } from 'framer-motion'
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

export function VirtualizedGrid({
  items,
  thumbnailSize,
  onSelectItem,
  selectedItem
}: VirtualizedGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const { openViewer } = useImageViewer()

  const mediaItems = items.filter(item =>
    item.mimeType?.startsWith('image/') ||
    item.mimeType?.startsWith('video/')
  )

  const getThumbnailDimensions = useCallback(() => {
    switch (thumbnailSize) {
      case 'small':
        return { width: 160, height: 160, gap: 12 }
      case 'large':
        return { width: 320, height: 320, gap: 24 }
      default:
        return { width: 240, height: 240, gap: 16 }
    }
  }, [thumbnailSize])

  const { width: itemWidth, height: itemHeight, gap } = getThumbnailDimensions()
  const padding = gap

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
                    gridTemplateColumns: `repeat(${columnCount}, ${itemWidth}px)`,
                    gap: `${gap}px`,
                    justifyContent: 'center'
                  }}
                >
                  {rowItems.map((item) => (
                    <FileCard
                      key={item.id}
                      item={item}
                      width={itemWidth}
                      height={itemHeight}
                      isSelected={selectedItem?.id === item.id}
                      onSelect={onSelectItem}
                      onDoubleClick={handleItemDoubleClick}
                    />
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