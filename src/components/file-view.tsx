"use client"

import { useEffect, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { animate, spring, stagger } from "motion"
import {
  Copy,
  Download,
  FolderIcon,
  ImageIcon,
  Info,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { AdvancedImageViewer } from "./advanced-image-viewer"

export type FileItem = {
  id: string
  name: string
  extension: string
  size: string
  type: "folder" | "image"
  thumbnail?: string
  dateModified: string
  dateCreated: string
  dimensions?: string
  children?: FileItem[]
}

interface FileViewProps {
  view: "grid" | "list" | "details"
  thumbnailSize: "small" | "medium" | "large"
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
  files: FileItem[]
}

export function FileView({
  view,
  thumbnailSize,
  onSelectItem,
  selectedItem,
  files,
}: FileViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const gap = 1
  const itemWidth =
    thumbnailSize === "small" ? 120 : thumbnailSize === "medium" ? 150 : 180
  const itemHeight =
    thumbnailSize === "small" ? 120 : thumbnailSize === "medium" ? 150 : 180

  const columns = Math.max(1, Math.floor((containerWidth - gap) / (itemWidth + gap)))
  const rows = Math.ceil(files.length / columns)

  useEffect(() => {
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
      case "small":
        return "h-20 w-20"
      case "medium":
        return "h-28 w-28"
      case "large":
        return "h-36 w-36"
      default:
        return "h-28 w-28"
    }
  }

  const renderFileIcon = (file: FileItem) => {
    const iconSize = getThumbnailSize()
    return file.type === "folder" ? (
      <FolderIcon className={`${iconSize} p-4 text-blue-500`} />
    ) : (
      <img
        src={file.thumbnail}
        alt={file.name}
        className={`${iconSize} rounded-md object-cover`}
        loading="lazy"
      />
    )
  }

  useEffect(() => {
    // Esperar a que los elementos estén en el DOM
    const elements = document.querySelectorAll(".file-item")
    if (elements.length > 0) {
      animate(
        elements,
        { opacity: [0, 1], scale: [0.9, 1] },
        { delay: stagger(0.05), duration: 0.3, easing: spring() }
      )
    }
  }, [view, thumbnailSize, files.length])

  const handleItemClick = (item: FileItem) => {
    onSelectItem(item)
  }

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === "image") {
      const index = files.findIndex((file) => file.id === item.id)
      setViewerIndex(index)
      setIsViewerOpen(true)
    }
  }

  const handleItemAction = (action: string, item: FileItem) => {
    switch (action) {
      case "open":
        handleItemClick(item)
        break
      case "download":
        console.log("Downloading:", item.name)
        break
      case "share":
        console.log("Sharing:", item.name)
        break
      case "copy":
        console.log("Copying:", item.name)
        break
      case "rename":
        console.log("Renaming:", item.name)
        break
      case "delete":
        console.log("Deleting:", item.name)
        break
      case "info":
        handleItemClick(item)
        break
    }
  }

  const renderGridItem = (file: FileItem) => {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "file-item group cursor-pointer rounded-sm p-0.5 transition-all hover:scale-105 hover:bg-muted/70",
              selectedItem?.id === file.id && "bg-muted"
            )}
            style={{
              width: itemWidth,
              height: itemHeight,
            }}
            onClick={() => handleItemClick(file)}
            onDoubleClick={() => handleItemDoubleClick(file)}
            role="button"
            tabIndex={0}
            aria-label={`${file.name} ${file.type === "folder" ? "folder" : "image"}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleItemDoubleClick(file)
              if (e.key === " ") {
                e.preventDefault()
                handleItemClick(file)
              }
            }}
          >
            <div className="flex h-full flex-col items-center justify-center">
              <div className="flex flex-1 items-center justify-center">
                {renderFileIcon(file)}
              </div>
              <div className="mt-1 w-full text-center">
                <span className="block truncate px-1 text-xs font-medium">
                  {file.name}
                </span>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={() => handleItemAction("open", file)}>
            Open
            <ContextMenuShortcut>⏎</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleItemAction("download", file)}>
            <Download className="mr-2 h-4 w-4" />
            Download
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleItemAction("share", file)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleItemAction("copy", file)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleItemAction("rename", file)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
            <ContextMenuShortcut>⌘R</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleItemAction("delete", file)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
            <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleItemAction("info", file)}>
            <Info className="mr-2 h-4 w-4" />
            Properties
            <ContextMenuShortcut>⌘I</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  const renderListView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow
            key={file.id}
            className={cn(
              "cursor-pointer",
              selectedItem?.id === file.id && "bg-muted"
            )}
            onClick={() => handleItemClick(file)}
            onDoubleClick={() => handleItemDoubleClick(file)}
          >
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {file.type === "folder" ? (
                  <FolderIcon className="h-4 w-4 text-blue-500" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-green-500" />
                )}
                {file.name}
              </div>
            </TableCell>
            <TableCell>{file.size}</TableCell>
            <TableCell>
              {new Date(file.dateModified).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {file.type === "folder" ? "Folder" : file.extension.toUpperCase()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderGridView = () => {
    const virtualRows = rowVirtualizer.getVirtualItems()
    const totalHeight = rowVirtualizer.getTotalSize()

    return (
      <div
        ref={parentRef}
        className="h-full overflow-auto"
        style={{
          width: "100%",
          height: "100%",
          contain: "strict",
        }}
      >
        <div
          className="relative w-full"
          style={{
            height: `${totalHeight}px`,
          }}
        >
          {virtualRows.map((virtualRow) => {
            const start = virtualRow.index * columns
            const end = Math.min(start + columns, files.length)
            const rowFiles = files.slice(start, end)

            return (
              <div
                key={virtualRow.index}
                className="absolute flex w-full gap-0.5 p-0.5"
                style={{
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${itemHeight}px`,
                }}
              >
                {rowFiles.map((file) => (
                  <div key={file.id}>{renderGridItem(file)}</div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full w-full">
        {view === "grid" && renderGridView()}
        {view === "list" && renderListView()}
      </div>

      {isViewerOpen && (
        <AdvancedImageViewer
          images={files.filter((f) => f.type === "image").map((f) => ({
            id: f.id,
            name: f.name,
            thumbnail: f.thumbnail || "",
            url: f.thumbnail || "",
          }))}
          currentIndex={viewerIndex}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  )
}