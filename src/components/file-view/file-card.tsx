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

  const handleCopyLink = () => {
    if (item.url) {
      navigator.clipboard.writeText(item.url)
      toast({
        title: "Enlace copiado",
        description: "El enlace ha sido copiado al portapapeles"
      })
    }
  }

  const handleDownload = () => {
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
  }

  const getFileIcon = () => {
    if (item.mimeType?.startsWith('video/')) return '🎥'
    if (item.mimeType?.startsWith('image/')) return '🖼️'
    if (item.mimeType === 'image/gif') return '🎞️'
    return '📄'
  }

  const isVideo = item.mimeType?.startsWith('video/')
  const isGif = item.mimeType === 'image/gif'
  const isImage = item.mimeType?.startsWith('image/')
  const isViewable = isImage || isVideo || isGif

  const handleDoubleClick = () => {
    if (isViewable) {
      onDoubleClick(item)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          layoutId={item.id}
          className={cn(
            "group relative w-full aspect-square rounded-lg border bg-card hover:bg-accent cursor-pointer overflow-hidden",
            isSelected && "ring-2 ring-primary"
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1]
          }}
          onClick={() => onSelect(item)}
          onDoubleClick={handleDoubleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width,
            height
          }}
        >
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
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 opacity-0 group-hover:opacity-100"
            initial={false}
            transition={{ duration: 0.15 }}
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
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={handleDoubleClick}
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