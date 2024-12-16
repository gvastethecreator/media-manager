'use client'

import { motion } from 'framer-motion'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Copy, Download, Eye, Share2, Trash2, Play } from 'lucide-react'
import type { FileItem } from '@/store/files'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/format'
import { useToast } from '@/components/ui/use-toast'
import { useCallback } from 'react'

interface FileCardProps {
  item: FileItem
  width: number
  height: number
  isSelected: boolean
  onSelect: (item: FileItem) => void
  onDoubleClick: (item: FileItem) => void
}

export function FileCard({
  item,
  width,
  height,
  isSelected,
  onSelect,
  onDoubleClick
}: FileCardProps) {
  const { toast } = useToast()

  const handleCopyLink = useCallback(() => {
    if (item.url) {
      navigator.clipboard.writeText(item.url)
      toast({
        title: "Enlace copiado",
        description: "El enlace ha sido copiado al portapapeles"
      })
    }
  }, [item.url, toast])

  const handleDownload = useCallback(() => {
    if (item.url) {
      const a = document.createElement('a')
      a.href = item.url
      a.download = item.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({
        title: "Descarga iniciada",
        description: "El archivo se está descargando"
      })
    }
  }, [item.url, item.name, toast])

  const getFileIcon = useCallback(() => {
    if (item.mimeType?.startsWith('video/')) return '🎥'
    if (item.mimeType?.startsWith('image/')) return '🖼️'
    if (item.mimeType === 'image/gif') return '🎞️'
    return '📄'
  }, [item.mimeType])

  const isVideo = item.mimeType?.startsWith('video/')
  const isGif = item.mimeType === 'image/gif'
  const isImage = item.mimeType?.startsWith('image/')
  const isViewable = isImage || isVideo || isGif

  const handleItemClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect(item)
  }, [item, onSelect])

  const handleItemDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Double click event:', {
      isViewable,
      hasUrl: !!item.url,
      hasThumbnail: !!item.thumbnailUrl,
      mimeType: item.mimeType
    })

    if (isViewable && (item.url || item.thumbnailUrl)) {
      console.log('Opening viewer for:', item)
      onDoubleClick(item)
    }
  }, [item, isViewable, onDoubleClick])

  const handleViewerOpen = useCallback(() => {
    console.log('Menu click - Opening viewer:', {
      isViewable,
      hasUrl: !!item.url,
      hasThumbnail: !!item.thumbnailUrl,
      mimeType: item.mimeType
    })

    if (isViewable && (item.url || item.thumbnailUrl)) {
      console.log('Calling onDoubleClick with:', item)
      onDoubleClick(item)
    }
  }, [item, isViewable, onDoubleClick])

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          layoutId={item.id}
          className={cn(
            "group relative w-full aspect-square rounded-lg border bg-card overflow-hidden",
            "hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background",
            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1]
          }}
          onClick={handleItemClick}
          onDoubleClick={handleItemDoubleClick}
          style={{
            width,
            height
          }}
        >
          {/* Contenedor de la imagen/icono */}
          <div className="absolute inset-0">
            {item.thumbnailUrl ? (
              <div className="relative h-full w-full">
                <motion.img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  loading="lazy"
                  draggable={false}
                />
                {(isVideo || isGif) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white/90" />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <span className="text-2xl">{getFileIcon()}</span>
              </div>
            )}
          </div>

          {/* Overlay con información */}
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-white truncate">
                {item.name}
              </p>
              <p className="text-xs text-white/70">
                {formatFileSize(item.size)}
                {item.width && item.height && ` • ${item.width}x${item.height}`}
                {item.duration && ` • ${Math.round(item.duration)}s`}
                {item.fps && ` • ${item.fps}fps`}
              </p>
            </div>
          </motion.div>

          {/* Overlay de selección */}
          <div className={cn(
            "absolute inset-0",
            isSelected ? 'bg-primary/10' : 'bg-transparent',
            "group-hover:bg-primary/5",
            "transition-colors duration-150"
          )} />
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={handleViewerOpen}
          disabled={!isViewable}
        >
          <Eye className="mr-2 h-4 w-4" />
          {isVideo ? 'Reproducir video' : 'Ver imagen'}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar enlace
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Descargar
        </ContextMenuItem>
        <ContextMenuItem>
          <Share2 className="mr-2 h-4 w-4" />
          Compartir
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}