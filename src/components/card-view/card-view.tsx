'use client'

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, Variants, LazyMotion, domAnimation, m } from "framer-motion"
import { FolderIcon, TagIcon, BookmarkIcon } from "lucide-react"
import { useVirtualizer } from '@tanstack/react-virtual'

export interface CardItem {
  id: string
  name: string
  description: string
  thumbnails: string[]
  count: number
  totalSize: string
  tags: string[]
  color: string
  emoji?: string
}

interface CardViewProps {
  items: (CardItem & { type?: 'collections' | 'folders' | 'tags' })[]
  type: 'collections' | 'folders' | 'tags' | 'cards'
  onSelect?: (item: CardItem & { type?: 'collections' | 'folders' | 'tags' }) => void
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  }
}

const itemAnimation: Variants = {
  hidden: { opacity: 0, y: 5 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

const getIcon = (type: 'collections' | 'folders' | 'tags' | 'cards', itemType?: 'collections' | 'folders' | 'tags') => {
  if (type === 'cards' && itemType) {
    return getIcon(itemType)
  }
  switch (type) {
    case 'collections':
      return BookmarkIcon
    case 'folders':
      return FolderIcon
    case 'tags':
      return TagIcon
    case 'cards':
      return BookmarkIcon // Default icon for cards view
  }
}

// Optimized thumbnail grid component
const ThumbnailGrid = React.memo(({ thumbnails, cardId, name }: { thumbnails: string[], cardId: string, name: string }) => {
  const visibleThumbnails = React.useMemo(() =>
    thumbnails.slice(0, 9).map((thumbnail, index) => (
      <div
        key={`${cardId}-thumb-${index}`}
        className="relative overflow-hidden aspect-[3/4]"
      >
        <img
          src={thumbnail}
          alt={`${name} thumbnail ${index + 1}`}
          className="w-full h-full object-cover rounded-md transition-transform duration-300 hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </div>
    )), [thumbnails, cardId, name])

  const emptyThumbnails = React.useMemo(() =>
    Array.from({ length: Math.max(0, 9 - thumbnails.length) }).map((_, index) => (
      <div
        key={`${cardId}-empty-${index}`}
        className="relative overflow-hidden rounded-md bg-muted/50 aspect-[3/4]"
      />
    )), [thumbnails.length, cardId])

  return (
    <div className="grid grid-cols-3 gap-2 aspect-[3/4]">
      {visibleThumbnails}
      {emptyThumbnails}
    </div>
  )
})
ThumbnailGrid.displayName = "ThumbnailGrid"

// Optimized card component
const CardItemComponent = React.memo(({
  item,
  type,
  Icon,
  onSelect,
}: {
  item: CardItem & { type?: 'collections' | 'folders' | 'tags' }
  type: 'collections' | 'folders' | 'tags' | 'cards'
  Icon: React.ElementType
  onSelect?: (item: CardItem & { type?: 'collections' | 'folders' | 'tags' }) => void
}) => {
  // Determine the icon based on the item type for unified view
  const ItemIcon = type === 'cards' && item.type ? getIcon(type, item.type) : Icon

  return (
    <m.div variants={itemAnimation} className="w-full">
      <Card
        className={cn(
          "group overflow-hidden hover:shadow-md cursor-pointer border-2",
          "hover:scale-[1.01] transition-all duration-150 bg-card/50 h-[520px]"
        )}
        style={{ borderColor: `${item.color}40` }}
        onClick={() => onSelect?.(item)}
      >
        <CardHeader className="pb-2 px-4 pt-4 space-y-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {type === 'collections' && item.emoji ? (
              <span className="text-2xl">{item.emoji}</span>
            ) : (
              <ItemIcon className="h-5 w-5" style={{ color: item.color }} />
            )}
            <span className="truncate">{item.name}</span>
          </CardTitle>
          {item.description && (
            <CardDescription className="line-clamp-2">
              {item.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-4">
          <ThumbnailGrid
            thumbnails={item.thumbnails}
            cardId={item.id}
            name={item.name}
          />
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 px-4 pb-4">
          <div className="flex justify-between w-full text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ItemIcon className="h-4 w-4" />
              {item.count} {type === 'collections' || (type === 'cards' && item.type === 'collections') ? 'imágenes' : type === 'folders' || (type === 'cards' && item.type === 'folders') ? 'archivos' : 'elementos'}
            </span>
            <span>{item.totalSize}</span>
          </div>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge
                  key={`${item.id}-${tag}`}
                  variant="secondary"
                  className="bg-muted/50 text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardFooter>
      </Card>
    </m.div>
  )
})

export function CardView({ items, type, onSelect }: CardViewProps) {
  const Icon = React.useMemo(() => getIcon(type), [type])
  const parentRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)

  // Update container width on mount and resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.clientWidth)
      }
    }
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    if (parentRef.current) {
      observer.observe(parentRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Calculate columns based on container width
  const columns = Math.max(1, Math.floor((containerWidth - 48) / 320)) // 48px for padding
  const rows = Math.ceil(items.length / columns)
  const rowHeight = 560 // Card height (520px) + gap (40px)

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 3
  })

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={parentRef} className="h-full overflow-auto">
        <m.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative w-full p-6"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowStartIndex = virtualRow.index * columns
            const rowEndIndex = Math.min((virtualRow.index + 1) * columns, items.length)
            const rowItems = items.slice(rowStartIndex, rowEndIndex)

            return (
              <div
                key={virtualRow.index}
                className={cn(
                  "absolute left-0 right-0 grid gap-x-6 gap-y-10 px-6",
                  columns === 1 ? "grid-cols-1" :
                  columns === 2 ? "grid-cols-2" :
                  columns === 3 ? "grid-cols-3" :
                  "grid-cols-4"
                )}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  width: '100%',
                }}
              >
                {rowItems.map((item) => (
                  <CardItemComponent
                    key={item.id}
                    item={item}
                    type={type}
                    Icon={Icon}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )
          })}
        </m.div>
      </div>
    </LazyMotion>
  )
}

