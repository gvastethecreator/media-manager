'use client'

import * as React from "react"
import { motion, Variants, LazyMotion, domAnimation, m } from "framer-motion"
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from "@/lib/utils"
import { FileIcon, FolderIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size: string
  modified: Date
  thumbnail?: string
  selected?: boolean
  favorite?: boolean
  tags?: string[]
  collections?: string[]
}

interface FileViewProps {
  items: FileItem[]
  onSelectItem?: (item: FileItem) => void
  onToggleSelect?: (item: FileItem) => void
  selectedItems?: string[]
  view?: 'grid' | 'list'
  thumbnailSize?: 'small' | 'medium' | 'large'
  itemsPerPage?: number
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

// Optimized thumbnail component with better memoization
const Thumbnail = React.memo(({ item }: { item: FileItem }) => {
  const content = React.useMemo(() => {
    if (item.type === 'folder') {
      return (
        <div className="flex items-center justify-center w-full h-full bg-muted/30 rounded-lg">
          <FolderIcon className="w-12 h-12 text-muted-foreground" />
        </div>
      )
    }

    return item.thumbnail ? (
      <img
        src={item.thumbnail}
        alt={item.name}
        className="w-full h-full object-cover rounded-lg"
        loading="lazy"
        decoding="async"
      />
    ) : (
      <div className="flex items-center justify-center w-full h-full bg-muted/30 rounded-lg">
        <FileIcon className="w-12 h-12 text-muted-foreground" />
      </div>
    )
  }, [item.type, item.thumbnail, item.name])

  return content
}, (prevProps, nextProps) => {
  return prevProps.item.type === nextProps.item.type &&
         prevProps.item.thumbnail === nextProps.item.thumbnail &&
         prevProps.item.name === nextProps.item.name
})
Thumbnail.displayName = "Thumbnail"

// Optimized grid item component
const GridItem = React.memo(({
  item,
  isSelected,
  onSelect,
  onToggleSelect,
  thumbnailSize = 'medium',
  style
}: {
  item: FileItem
  isSelected?: boolean
  onSelect?: (item: FileItem) => void
  onToggleSelect?: (item: FileItem) => void
  thumbnailSize?: 'small' | 'medium' | 'large'
  style?: React.CSSProperties
}) => {
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (e.ctrlKey || e.shiftKey) {
      onToggleSelect?.(item)
    } else {
      onSelect?.(item)
    }
  }, [item, onSelect, onToggleSelect])

  const sizes = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64'
  }

  return (
    <m.div variants={itemAnimation} style={style}>
      <div
        className={cn(
          "group relative cursor-pointer rounded-lg overflow-hidden",
          "hover:ring-2 hover:ring-primary",
          isSelected && "ring-2 ring-primary",
          sizes[thumbnailSize]
        )}
        onClick={handleClick}
      >
        <Thumbnail item={item} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="flex items-center justify-between">
              <span className="text-white truncate text-sm">{item.name}</span>
              {onToggleSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(item)}
                  className="data-[state=checked]:bg-primary"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </m.div>
  )
}, (prevProps, nextProps) => {
  return prevProps.item === nextProps.item &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.thumbnailSize === nextProps.thumbnailSize
})
GridItem.displayName = "GridItem"

// Optimized list item component
const ListItem = React.memo(({
  item,
  isSelected,
  onSelect,
  onToggleSelect,
  style
}: {
  item: FileItem
  isSelected?: boolean
  onSelect?: (item: FileItem) => void
  onToggleSelect?: (item: FileItem) => void
  style?: React.CSSProperties
}) => {
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (e.ctrlKey || e.shiftKey) {
      onToggleSelect?.(item)
    } else {
      onSelect?.(item)
    }
  }, [item, onSelect, onToggleSelect])

  return (
    <m.div variants={itemAnimation} style={style}>
      <div
        className={cn(
          "group flex items-center gap-4 p-2 rounded-lg cursor-pointer",
          "hover:bg-muted/50",
          isSelected && "bg-muted"
        )}
        onClick={handleClick}
      >
        <div className="w-10 h-10 shrink-0">
          <Thumbnail item={item} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{item.name}</span>
            {item.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="hidden sm:inline-flex">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{item.size}</span>
            <span>{item.modified.toLocaleString()}</span>
          </div>
        </div>
        {onToggleSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(item)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>
    </m.div>
  )
}, (prevProps, nextProps) => {
  return prevProps.item === nextProps.item &&
         prevProps.isSelected === nextProps.isSelected
})
ListItem.displayName = "ListItem"

export function FileView({
  items,
  onSelectItem,
  onToggleSelect,
  selectedItems = [],
  view = 'grid',
  thumbnailSize = 'medium',
  itemsPerPage = 24
}: FileViewProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

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

  // Calculate columns based on container width and thumbnail size
  const itemWidth = thumbnailSize === 'small' ? 128 : thumbnailSize === 'medium' ? 192 : 256
  const columns = view === 'grid' ? Math.max(1, Math.floor((containerWidth - 32) / (itemWidth + 16))) : 1
  const rows = Math.ceil(currentItems.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => view === 'grid' ? itemWidth + 16 : 64,
    overscan: 3
  })

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const maxVisible = 5
    const pages = []
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      pages.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
        </PaginationItem>
      )
      if (startPage > 2) {
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return (
      <Pagination className="py-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          {pages}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex flex-col h-full">
        <div
          ref={parentRef}
          className="flex-1 overflow-auto"
          style={{
            contain: 'strict'
          }}
        >
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            className="relative"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowItems = currentItems.slice(
                virtualRow.index * columns,
                Math.min((virtualRow.index + 1) * columns, currentItems.length)
              )

              return (
                <div
                  key={virtualRow.index}
                  className={cn(
                    "absolute top-0 left-0 w-full p-4",
                    view === 'grid' && "grid gap-4",
                    view === 'grid' && `grid-cols-${columns}`
                  )}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {rowItems.map((item) => (
                    view === 'grid' ? (
                      <GridItem
                        key={item.id}
                        item={item}
                        isSelected={selectedItems.includes(item.id)}
                        onSelect={onSelectItem}
                        onToggleSelect={onToggleSelect}
                        thumbnailSize={thumbnailSize}
                      />
                    ) : (
                      <ListItem
                        key={item.id}
                        item={item}
                        isSelected={selectedItems.includes(item.id)}
                        onSelect={onSelectItem}
                        onToggleSelect={onToggleSelect}
                      />
                    )
                  ))}
                </div>
              )
            })}
          </m.div>
        </div>
        {renderPagination()}
      </div>
    </LazyMotion>
  )
}