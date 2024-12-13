'use client'

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FolderIcon, ImageIcon, Copy, Download, Share2, Trash2, Pencil, Info } from 'lucide-react'
import { animate, stagger, spring } from "motion"
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { AdvancedImageViewer } from './advanced-image-viewer'
import { useState } from 'react';

type FileViewProps = {
  view: 'grid' | 'list' | 'details'
  thumbnailSize: 'small' | 'medium' | 'large'
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
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

// Generate sample files with folders first
const files: FileItem[] = [
  // Folders
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `folder-${i + 1}`,
    name: `Folder ${i + 1}`,
    extension: '',
    size: `${Math.floor(Math.random() * 10) + 1} items`,
    type: 'folder' as const,
    dateModified: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    dateCreated: new Date(Date.now() - Math.floor(Math.random() * 20000000000)).toISOString(),
    children: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, j) => ({
      id: `folder-${i + 1}-image-${j + 1}`,
      name: `Image ${j + 1}`,
      extension: j % 2 === 0 ? '.jpg' : '.png',
      size: `${Math.floor(Math.random() * 10) + 1} MB`,
      type: 'image' as const,
      thumbnail: `/placeholder.svg?height=400&width=400`,
      dateModified: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      dateCreated: new Date(Date.now() - Math.floor(Math.random() * 20000000000)).toISOString(),
      dimensions: `${1920 + j}x${1080 + j}`,
    }))
  })),
  // Images
  ...Array.from({ length: 90 }, (_, i) => ({
    id: `image-${i + 1}`,
    name: `Image ${i + 1}`,
    extension: i % 2 === 0 ? '.jpg' : '.png',
    size: `${Math.floor(Math.random() * 10) + 1} MB`,
    type: 'image' as const,
    thumbnail: `/placeholder.svg?height=400&width=400`,
    dateModified: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    dateCreated: new Date(Date.now() - Math.floor(Math.random() * 20000000000)).toISOString(),
    dimensions: `${1920 + i}x${1080 + i}`,
  })),
]

export function FileView({ view, thumbnailSize, onSelectItem, selectedItem }: FileViewProps) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const gap = 1 // Reduced gap between items to 1px

  // Calculate item dimensions based on thumbnail size
  const itemWidth = thumbnailSize === 'small' ? 120 : thumbnailSize === 'medium' ? 150 : 180
  const itemHeight = thumbnailSize === 'small' ? 120 : thumbnailSize === 'medium' ? 150 : 180


  // Calculate columns based on container width
  const columns = Math.max(1, Math.floor((containerWidth - gap) / (itemWidth + gap)))
  const rows = Math.ceil(files.length / columns)

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

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan: 5,
  })

  const getThumbnailSize = () => {
    switch (thumbnailSize) {
      case 'small': return 'h-20 w-20'
      case 'medium': return 'h-28 w-28'
      case 'large': return 'h-36 w-36'
      default: return 'h-28 w-28'
    }
  }

  const renderFileIcon = (file: FileItem) => {
    const iconSize = getThumbnailSize()
    return file.type === 'folder' ? (
      <FolderIcon className={`${iconSize} p-4 text-blue-500`} />
    ) : (
      <img 
        src={file.thumbnail} 
        alt={file.name} 
        className={`${iconSize} object-cover rounded-md`}
      />
    )
  }

  React.useEffect(() => {
    animate(
      ".file-item",
      { opacity: [0, 1], scale: [0.9, 1] },
      { delay: stagger(0.05), duration: 0.3, easing: spring() }
    )
  }, [view, thumbnailSize])

  const handleItemClick = (item: FileItem) => {
    onSelectItem(item)
  }

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'image') {
      const index = files.findIndex(file => file.id === item.id)
      setViewerIndex(index)
      setIsViewerOpen(true)
    }
  }

  const handleItemAction = (action: string, item: FileItem) => {
    switch (action) {
      case 'open':
        handleItemClick(item)
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
        handleItemClick(item)
        break
    }
  }

  const renderGridItem = (file: FileItem) => {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={`file-item rounded-sm transition-all hover:scale-105 cursor-pointer p-0.5 hover:bg-muted/70 group ${selectedItem?.id === file.id ? 'bg-muted' : ''}`}
            style={{
              width: itemWidth,
              height: itemHeight,
            }}
            onClick={() => handleItemClick(file)}
            onDoubleClick={() => handleItemDoubleClick(file)}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex-1 flex items-center justify-center">
                {renderFileIcon(file)}
              </div>
              <div className="w-full text-center mt-1">
                <span className="text-xs font-medium truncate block px-1">{file.name}</span>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={() => handleItemAction('open', file)}>
            Open
            <ContextMenuShortcut>⏎</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleItemAction('download', file)}>
            <Download className="mr-2 h-4 w-4" />
            Download
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleItemAction('share', file)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleItemAction('copy', file)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleItemAction('rename', file)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
            <ContextMenuShortcut>⌘R</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleItemAction('delete', file)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
            <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleItemAction('info', file)}>
            <Info className="mr-2 h-4 w-4" />
            Properties
            <ContextMenuShortcut>⌘I</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  const renderContent = () => {
    switch (view) {
      case 'grid':
        return (
          <div 
            ref={parentRef}
            className="h-full overflow-auto px-1"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${itemWidth}px, 1fr))`,
                gap: `${gap}px`,
                padding: `${gap}px`,
              }}
            >
              {files.map((file) => (
                <React.Fragment key={file.id}>
                  {renderGridItem(file)}
                </React.Fragment>
              ))}
            </div>
          </div>
        )
      case 'list':
        return (
          <div 
            ref={parentRef}
            className="h-full overflow-auto px-4"
          >
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`file-item flex items-center p-2 rounded-lg hover:bg-muted/70 transition-all group cursor-pointer ${false ? 'bg-muted' : ''}`}
                  onClick={() => handleItemClick(file)}
                >
                  <div className="w-8 h-8 mr-2 flex items-center justify-center">
                    {file.type === 'folder' ? (
                      <FolderIcon className="w-6 h-6 text-blue-500" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {file.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {file.size}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(file.dateModified).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      case 'details':
        return (
          <div 
            ref={parentRef}
            className="h-full overflow-auto"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow 
                    key={file.id}
                    className={`file-item group cursor-pointer ${false ? 'bg-muted' : ''}`}
                    onClick={() => handleItemClick(file)}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-6 h-6 mr-2 flex items-center justify-center">
                          {file.type === 'folder' ? (
                            <FolderIcon className="w-4 h-4 text-blue-500" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <span className="text-sm truncate">
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {file.type}
                    </TableCell>
                    <TableCell className="text-sm">
                      {file.size}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(file.dateModified).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
    }
  }

  return (
    <div className="h-full overflow-hidden">
      {renderContent()}
      {isViewerOpen && (
        <AdvancedImageViewer
          images={files.filter(file => file.type === 'image')}
          currentIndex={viewerIndex}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  )
}

