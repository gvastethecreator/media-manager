'use client'

import * as React from "react"
import { FileView } from "@/components/file-view/file-view"
import { CardView } from "@/components/card-view/card-view"
import { MainToolbar } from "@/components/main-toolbar/main-toolbar"
import { useFiles } from "@/context/FilesContext"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderIcon, TagIcon, ImageIcon, BookmarkIcon } from "lucide-react"

const EmptyState = ({ type }: { type: string }) => {
  const icons = {
    collections: BookmarkIcon,
    folders: FolderIcon,
    tags: TagIcon,
    files: ImageIcon,
  }
  const Icon = icons[type as keyof typeof icons] || ImageIcon

  const messages = {
    collections: "No hay colecciones",
    folders: "No hay carpetas",
    tags: "No hay etiquetas",
    files: "No hay archivos"
  }

  const descriptions = {
    collections: "Crea una nueva colección para organizar tus imágenes",
    folders: "Agrega una carpeta para organizar tus archivos",
    tags: "Crea etiquetas para clasificar tus imágenes",
    files: "Agrega algunos archivos para empezar"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground"
    >
      <Icon className="w-12 h-12 mb-4" />
      <h3 className="text-lg font-medium mb-2">{messages[type as keyof typeof messages]}</h3>
      <p className="text-sm">{descriptions[type as keyof typeof descriptions]}</p>
    </motion.div>
  )
}

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

const Breadcrumbs = ({ path }: { path: string[] }) => (
  <div className="flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground border-b">
    {path.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span className="text-muted-foreground/50">/</span>}
        <span className={cn(
          "hover:text-foreground cursor-pointer transition-colors",
          index === path.length - 1 && "text-foreground font-medium"
        )}>
          {item}
        </span>
      </React.Fragment>
    ))}
  </div>
)

export function MainContent() {
  const {
    currentView,
    currentItems,
    collections,
    folders,
    tags,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    view,
    thumbnailSize,
    handleSelectItem,
    isLoading,
    currentPath
  } = useFiles()

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />
    }

    switch (currentView) {
      case 'collections':
        return collections.length > 0 ? (
          <CardView
            items={collections.map(c => ({
              id: c.id,
              name: c.name,
              description: c.description,
              thumbnails: c.thumbnails,
              count: c.count,
              totalSize: c.totalSize,
              tags: c.tags,
              color: c.color,
              emoji: c.emoji
            }))}
            type="collections"
            onSelect={item => handleSelectCollection(item.id)}
          />
        ) : (
          <EmptyState type="collections" />
        )

      case 'folders':
        return folders.length > 0 ? (
          <CardView
            items={folders.map(f => ({
              id: f.id,
              name: f.name,
              description: f.description,
              thumbnails: f.thumbnails,
              count: f.count,
              totalSize: f.totalSize,
              tags: [],
              color: f.color
            }))}
            type="folders"
            onSelect={item => handleSelectFolder(item.id)}
          />
        ) : (
          <EmptyState type="folders" />
        )

      case 'tags':
        return tags.length > 0 ? (
          <CardView
            items={tags.map(t => ({
              id: t.id,
              name: t.name,
              description: t.description,
              thumbnails: t.thumbnails,
              count: t.count,
              totalSize: t.totalSize,
              tags: [t.name],
              color: t.color
            }))}
            type="tags"
            onSelect={item => handleSelectTag(item.name)}
          />
        ) : (
          <EmptyState type="tags" />
        )

      default:
        return currentItems.length > 0 ? (
          <FileView
            items={currentItems}
            onSelectItem={handleSelectItem}
            view={view}
            thumbnailSize={thumbnailSize}
          />
        ) : (
          <EmptyState type="files" />
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MainToolbar />
      {currentPath && currentPath.length > 0 && (
        <Breadcrumbs path={currentPath} />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex-1 overflow-auto",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          )}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

