'use client'

import { useRef, forwardRef, useEffect, useState, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { FileItem } from '@/store/files'
import { formatFileSize } from '@/lib/utils'
import { FileIcon, FolderIcon, MoreHorizontal, ChevronUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useImageViewer } from '@/store/image-viewer'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface VirtualizedListProps {
  items: FileItem[]
  onSelectItem: (item: FileItem | string) => void
  selectedItem: FileItem | null
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const FileItemIcon = ({ item }: { item: FileItem }) => {
  if (item.type === 'folder') {
    return <FolderIcon className="h-4 w-4" />
  }

  if (item.thumbnailUrl || item.url) {
    return (
      <div className="relative w-6 h-6 rounded-sm overflow-hidden bg-muted">
        <img
          src={item.thumbnailUrl || item.url}
          alt={item.name}
          className="object-cover w-full h-full"
          onError={(e) => {
            const fallback = document.createElement('div')
            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'
            e.currentTarget.parentElement?.replaceChild(fallback.firstChild!, e.currentTarget)
          }}
        />
      </div>
    )
  }

  return <FileIcon className="h-4 w-4" />
}

const ListItem = forwardRef<HTMLTableRowElement, {
  item: FileItem
  isSelected: boolean
  onSelect: (item: FileItem) => void
  onDoubleClick: (item: FileItem) => void
  index: number
  style?: React.CSSProperties
}>(({ item, isSelected, onSelect, onDoubleClick, index, style }, ref) => (
  <ContextMenu>
    <ContextMenuTrigger asChild>
      <TableRow
        ref={ref}
        className={cn(
          "cursor-pointer h-10",
          "hover:bg-accent/50 hover:text-accent-foreground",
          "transition-colors duration-150",
          isSelected && "bg-accent/40 text-accent-foreground",
          index % 2 === 0 ? "bg-muted/30" : "bg-background"
        )}
        onClick={() => onSelect(item)}
        onDoubleClick={() => onDoubleClick(item)}
        style={style}
      >
        <TableCell className="w-[5%] p-0 min-w-[40px]">
          <div className="flex items-center justify-center h-full">
            <FileItemIcon item={item} />
          </div>
        </TableCell>
        <TableCell className="py-0 pl-2 w-[45%] min-w-[200px]">
          <p className="text-sm truncate">
            {item.name}
          </p>
        </TableCell>
        <TableCell className="text-right text-xs text-muted-foreground w-[25%] min-w-[120px] py-0 px-4">
          {formatDate(item.modified)}
        </TableCell>
        <TableCell className="text-right text-xs text-muted-foreground w-[12.5%] min-w-[80px] py-0 px-4 capitalize">
          {item.type}
        </TableCell>
        <TableCell className="text-right text-xs text-muted-foreground w-[12.5%] min-w-[80px] py-0 pl-4 pr-6">
          {formatFileSize(item.size)}
        </TableCell>
      </TableRow>
    </ContextMenuTrigger>
    <ContextMenuContent className="w-64">
      <ContextMenuItem onSelect={() => onDoubleClick(item)}>
        Abrir
        <ContextMenuShortcut>↵</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem>
        Descargar
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <span className="flex items-center">
            Más acciones
            <MoreHorizontal className="ml-2 h-4 w-4" />
          </span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem>
            Copiar
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Mover
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-red-600">
            Eliminar
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContent>
  </ContextMenu>
))

ListItem.displayName = 'ListItem'

export function VirtualizedList({
  items,
  onSelectItem,
  selectedItem
}: VirtualizedListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const itemHeight = 40
  const { openViewer } = useImageViewer()
  const [sorting, setSorting] = useState<{ column: keyof FileItem; direction: 'asc' | 'desc' }>({
    column: 'name',
    direction: 'asc'
  })

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const value1 = a[sorting.column]
      const value2 = b[sorting.column]

      if (value1 === value2) return 0

      const direction = sorting.direction === 'asc' ? 1 : -1
      if (value1 < value2) return -1 * direction
      return 1 * direction
    })
  }, [items, sorting])

  const virtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5
  })

  const handleSort = (column: keyof FileItem) => {
    setSorting(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleDoubleClick = (item: FileItem) => {
    if (item.mimeType?.startsWith('image/') || item.mimeType?.startsWith('video/')) {
      openViewer(item, items)
    }
  }

  return (
    <ScrollArea className="h-full w-full">
      <div ref={parentRef} className="h-full w-full relative">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TableRow>
              <TableHead className="w-[5%] p-0 min-w-[40px]" />
              <TableHead
                className="py-0 pl-2 w-[45%] min-w-[200px] cursor-pointer hover:bg-accent/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Nombre
                  {sorting.column === 'name' && (
                    <ChevronUpIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        sorting.direction === 'desc' && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="text-right w-[25%] min-w-[120px] py-0 px-4 cursor-pointer hover:bg-accent/50"
                onClick={() => handleSort('modified')}
              >
                <div className="flex items-center justify-end gap-2">
                  Modificado
                  {sorting.column === 'modified' && (
                    <ChevronUpIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        sorting.direction === 'desc' && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="text-right w-[12.5%] min-w-[80px] py-0 px-4 cursor-pointer hover:bg-accent/50"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center justify-end gap-2">
                  Tipo
                  {sorting.column === 'type' && (
                    <ChevronUpIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        sorting.direction === 'desc' && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="text-right w-[12.5%] min-w-[80px] py-0 pl-4 pr-6 cursor-pointer hover:bg-accent/50"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center justify-end gap-2">
                  Tamaño
                  {sorting.column === 'size' && (
                    <ChevronUpIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        sorting.direction === 'desc' && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <div
                  className="relative w-full"
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                  }}
                >
                  {virtualizer.getVirtualItems().map(virtualRow => {
                    const item = sortedItems[virtualRow.index]
                    if (!item) return null
                    const isSelected = selectedItem?.id === item.id

                    return (
                      <ListItem
                        key={item.id}
                        item={item}
                        index={virtualRow.index}
                        isSelected={isSelected}
                        onSelect={onSelectItem}
                        onDoubleClick={handleDoubleClick}
                        style={{
                          position: 'absolute',
                          top: `${virtualRow.start}px`,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`
                        }}
                      />
                    )
                  })}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  )
}