'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Copy, Download, Eye, Share2, Trash2, Play, AlertCircle } from 'lucide-react'
import type { FileItem } from '@/store/files'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/format'
import { useToast } from '@/components/ui/use-toast'
import { useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface FileCardProps {
  item: FileItem
  width: number
  height: number
  isSelected: boolean
  onSelect: (item: FileItem) => void
  onDoubleClick: (item: FileItem) => void
}

const imageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

const overlayVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0, 0, 0.2, 1]
    }
  }
}

const selectionVariants = {
  unselected: {
    opacity: 0,
    transition: { duration: 0.15 }
  },
  selected: {
    opacity: 0.1,
    transition: { duration: 0.2 }
  }
}

// Mejoramos los gradientes con más variedad y sutileza
const getRandomGradient = () => {
  const gradients = [
    'bg-gradient-to-br from-pink-500/10 via-purple-500/15 to-indigo-500/20 hover:from-pink-500/20 hover:via-purple-500/25 hover:to-indigo-500/30',
    'bg-gradient-to-br from-blue-500/10 via-teal-500/15 to-emerald-500/20 hover:from-blue-500/20 hover:via-teal-500/25 hover:to-emerald-500/30',
    'bg-gradient-to-br from-orange-500/10 via-amber-500/15 to-yellow-500/20 hover:from-orange-500/20 hover:via-amber-500/25 hover:to-yellow-500/30',
    'bg-gradient-to-br from-rose-500/10 via-fuchsia-500/15 to-violet-500/20 hover:from-rose-500/20 hover:via-fuchsia-500/25 hover:to-violet-500/30',
    'bg-gradient-to-br from-cyan-500/10 via-sky-500/15 to-blue-500/20 hover:from-cyan-500/20 hover:via-sky-500/25 hover:to-blue-500/30',
    'bg-gradient-to-br from-lime-500/10 via-green-500/15 to-emerald-500/20 hover:from-lime-500/20 hover:via-green-500/25 hover:to-emerald-500/30'
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
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
  const [imageStatus, setImageStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [gradient] = useState(getRandomGradient) // Generamos un gradiente aleatorio al montar

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
          className={cn(
            "group relative w-full aspect-square rounded-lg border bg-card overflow-hidden transition-all duration-300 ease-out",
            "shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)]",
            "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:-translate-y-0.5",
            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_4px_16px_rgba(0,0,0,0.16)]",
            gradient // Aplicamos el gradiente a toda la tarjeta
          )}
          style={{
            width,
            height
          }}
          onClick={handleItemClick}
          onDoubleClick={handleItemDoubleClick}
          initial="hidden"
          whileHover="visible"
          animate="hidden"
        >
          {/* Contenedor de la imagen/icono */}
          <div className="absolute inset-0">
            {item.thumbnailUrl ? (
              <div className="relative h-full w-full">
                {imageStatus === 'loading' && (
                  <motion.div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      gradient
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                {imageStatus === 'error' && (
                  <motion.div
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center",
                      gradient
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                    </motion.div>
                    <motion.span
                      className="text-xs text-muted-foreground/50 mt-2"
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    >
                      Error al cargar
                    </motion.span>
                  </motion.div>
                )}
                <motion.img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="h-full w-full object-cover transition-all duration-300 ease-out group-hover:scale-105"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{
                    opacity: imageStatus === 'success' ? 1 : 0,
                    scale: imageStatus === 'success' ? 1 : 1.1
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  loading="lazy"
                  draggable={false}
                  onLoad={() => setImageStatus('success')}
                  onError={() => setImageStatus('error')}
                  style={{ willChange: "transform, opacity" }}
                />
              </div>
            ) : (
              <div className={cn(
                "h-full w-full flex items-center justify-center",
                gradient
              )}>
                <motion.span
                  className="text-3xl opacity-50 transition-transform duration-300 ease-out group-hover:scale-110"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                >
                  {getFileIcon()}
                </motion.span>
              </div>
            )}
          </div>

          {/* Overlay con información */}
          <motion.div
            variants={overlayVariants}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-white truncate flex-1">
                  {item.name}
                </p>
                {isViewable && (
                  <span className="flex items-center">
                    {isVideo && <Play className="w-3.5 h-3.5 text-white/70" />}
                    {isGif && <Play className="w-3.5 h-3.5 text-white/70" />}
                    {!isVideo && !isGif && <Eye className="w-3.5 h-3.5 text-white/70" />}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/70">
                <span>{formatFileSize(item.size)}</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{item.extension?.toUpperCase()}</span>
              </div>
            </div>
          </motion.div>

          {/* Overlay de selección */}
          <motion.div
            variants={selectionVariants}
            initial="unselected"
            animate={isSelected ? "selected" : "unselected"}
            className="absolute inset-0 bg-primary pointer-events-none"
            style={{ willChange: "opacity" }}
          />
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