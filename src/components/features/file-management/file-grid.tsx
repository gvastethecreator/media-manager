import { useCallback, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { FileItem } from '@/types/files'
import { ImageCard } from './image-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FileGridProps {
  items: FileItem[]
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
}

export function FileGrid({ items, onLoadMore, hasMore, isLoading }: FileGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: hasMore ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5
  })

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse()

    if (!lastItem) {
      return
    }

    if (
      lastItem.index >= items.length - 1 &&
      hasMore &&
      !isLoading
    ) {
      onLoadMore()
    }
  }, [
    hasMore,
    onLoadMore,
    items.length,
    isLoading,
    rowVirtualizer.getVirtualItems()
  ])

  const handleImageSelect = useCallback((image: FileItem) => {
    // TODO: Implementar selección de imagen
    console.log('Selected image:', image)
  }, [])

  if (isLoading && items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{
        contain: 'strict'
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > items.length - 1
            const item = items[virtualRow.index]

            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {isLoaderRow ? (
                  hasMore ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner />
                    </div>
                  ) : null
                ) : (
                  <ImageCard
                    image={item}
                    onSelect={handleImageSelect}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}