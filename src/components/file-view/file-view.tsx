'use client'

import * as React from "react"
import { AnimatePresence } from "framer-motion"
import { FolderIcon, ImageIcon } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

import { AdvancedImageViewer } from '@/components/image-viewer/advanced-image-viewer'
import { ImageFallback } from "@/components/ui/image-fallback"
import { mockFiles } from "@/lib/mock-data"

import { GridView } from './grid-view'
import { ListView } from './list-view'
import { DetailsView } from './details-view'

type FileViewProps = {
  view: 'grid' | 'list' | 'details'
  thumbnailSize: 'small' | 'medium' | 'large'
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
  files: FileItem[]
}

export type FileItem = {
  id: string
  name: string
  extension: string
  size: string
  type: 'folder' | 'image'
  thumbnail?: string
  dateModified: string
  dateCreated: string
  dimensions?: string
  children?: FileItem[]
}

const ITEMS_PER_PAGE = 50

export const FileView = React.memo(function FileView({ view, thumbnailSize, onSelectItem, selectedItem, files = mockFiles }: FileViewProps) {
  const [isViewerOpen, setIsViewerOpen] = React.useState(false)
  const [viewerIndex, setViewerIndex] = React.useState(0)
  const parentRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isAtBottom, setIsAtBottom] = React.useState(false)

  const itemWidth = React.useMemo(() =>
    thumbnailSize === 'small' ? 120 : thumbnailSize === 'medium' ? 160 : 200
  , [thumbnailSize])

  const itemHeight = React.useMemo(() =>
    thumbnailSize === 'small' ? 120 : thumbnailSize === 'medium' ? 160 : 200
  , [thumbnailSize])

  const gap = React.useMemo(() =>
    thumbnailSize === 'small' ? 8 : thumbnailSize === 'medium' ? 12 : 16
  , [thumbnailSize])

  const handleItemClick = React.useCallback((item: FileItem) => {
    onSelectItem(item)
  }, [onSelectItem])

  const handleItemDoubleClick = React.useCallback((item: FileItem) => {
    if (item.type === 'image') {
      const index = files.findIndex(file => file.id === item.id)
      setViewerIndex(index)
      setIsViewerOpen(true)
    } else if (item.type === 'folder') {
      console.log('Navigating to folder:', item.name)
    }
  }, [files])

  const handleItemAction = React.useCallback((action: string, item: FileItem) => {
    switch (action) {
      case 'open':
        if (item.type === 'image') {
          const index = files.findIndex(file => file.id === item.id)
          setViewerIndex(index)
          setIsViewerOpen(true)
        } else if (item.type === 'folder') {
          console.log('Navigating to folder:', item.name)
        }
        break
      case 'preview':
        if (item.type === 'image') {
          const index = files.findIndex(file => file.id === item.id)
          setViewerIndex(index)
          setIsViewerOpen(true)
        }
        break
      case 'download':
        console.log('Downloading:', item.name)
        break
      case 'share':
        console.log('Sharing:', item.name)
        break
      case 'copy':
        console.log('Copying:', item.name)
        break
      case 'rename':
        console.log('Renaming:', item.name)
        break
      case 'delete':
        console.log('Deleting:', item.name)
        break
      case 'info':
        onSelectItem(item)
        break
    }
  }, [files, onSelectItem])

  const renderFileIcon = React.useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      return <FolderIcon className="w-12 h-12 text-blue-500" />
    }

    const gradientColors = [
      `hsl(${parseInt(file.id.split('-')[1] || '0') * 40 % 360}, 95%, 75%)`,
      `hsl(${(parseInt(file.id.split('-')[1] || '0') * 40 + 60) % 360}, 95%, 75%)`
    ]

    return (
      <div className="w-full h-full">
        <ImageFallback
          src={file.thumbnail}
          alt={file.name}
          width={itemWidth - 32}
          height={itemHeight - 48}
          className="w-full h-full object-cover rounded-md"
          loading="lazy"
          gradientColors={gradientColors}
          showPlaceholder={!file.thumbnail}
        />
      </div>
    )
  }, [itemWidth, itemHeight])

  const renderContent = React.useCallback(() => {
    if (!files?.length) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No hay archivos para mostrar
        </div>
      )
    }

    switch (view) {
      case 'grid':
        return (
          <div ref={parentRef} className="h-full overflow-auto px-1">
            <GridView
              files={files}
              selectedItem={selectedItem}
              itemWidth={itemWidth}
              itemHeight={itemHeight}
              gap={gap}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              onItemAction={handleItemAction}
              renderFileIcon={renderFileIcon}
            />
          </div>
        )
      case 'list':
        return (
          <div ref={parentRef} className="h-full overflow-auto px-4">
            <ListView
              files={files}
              selectedItem={selectedItem}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              onItemAction={handleItemAction}
            />
          </div>
        )
      case 'details':
        return (
          <div ref={parentRef} className="h-full overflow-auto">
            <DetailsView
              files={files}
              selectedItem={selectedItem}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              onItemAction={handleItemAction}
            />
          </div>
        )
    }
  }, [
    files,
    view,
    selectedItem,
    itemWidth,
    itemHeight,
    gap,
    handleItemClick,
    handleItemDoubleClick,
    handleItemAction,
    renderFileIcon
  ])

  const totalPages = React.useMemo(() =>
    Math.ceil(files.length / ITEMS_PER_PAGE)
  , [files.length])

  const currentFiles = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return files.slice(start, end)
  }, [files, currentPage])

  const handleScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const clientHeight = element.clientHeight
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 100
    setIsAtBottom(isBottom)
  }, [])

  return (
    <div className="relative flex flex-col h-full">
      <ScrollArea
        ref={scrollRef}
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        <div className="px-1 pb-20">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className={cn(
          "fixed left-1/2 -translate-x-1/2 bottom-6 z-10",
          "bg-background/95 backdrop-blur-sm",
          "px-3 py-1.5 rounded-full shadow-lg border",
          "transition-all duration-200",
          isAtBottom && "relative bottom-0 mt-4 mb-2"
        )}>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(p => Math.max(1, p - 1))
                    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Mostrar siempre primera y última página
                  if (page === 1 || page === totalPages) return true
                  // Mostrar páginas cercanas a la actual
                  return Math.abs(page - currentPage) <= 1
                })
                .map((page, i, arr) => {
                  // Agregar elipsis si hay saltos
                  if (i > 0 && page - arr[i - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <PaginationItem>
                          <span className="px-2 text-muted-foreground">...</span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(page)
                              scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    )
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(p => Math.min(totalPages, p + 1))
                    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AdvancedImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={files.filter(f => f.type === 'image')}
        initialIndex={viewerIndex}
      />
    </div>
  )
})

