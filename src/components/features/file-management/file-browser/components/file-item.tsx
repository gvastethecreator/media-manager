'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { FileContextMenu } from './context-menu'
import { Copy, Download, Eye, Share2, Trash2, Play, AlertCircle } from 'lucide-react'
import type { FileItem } from '@/store/files'
import type { ThumbnailSize } from '@/store/ui'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/format'
import { useToast } from '@/components/ui/use-toast'
import { useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface FileCardProps {
  item: FileItem
  viewMode: 'grid' | 'list'
  thumbnailSize: ThumbnailSize
  isSelected: boolean
  onClick: () => void
  onDoubleClick: () => void
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
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  visible: {
    opacity: 1,
    y: 0,
    backdropFilter: 'blur(2px)',
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

const getRandomGradient = () => {
  const gradients = [
    'from-blue-500/10 to-purple-500/10',
    'from-green-500/10 to-emerald-500/10',
    'from-orange-500/10 to-red-500/10',
    'from-pink-500/10 to-rose-500/10',
    'from-violet-500/10 to-indigo-500/10',
    'from-cyan-500/10 to-blue-500/10'
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
}

export function FileCard({
  item,
  viewMode,
  thumbnailSize,
  isSelected,
  onClick,
  onDoubleClick
}: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [gradient] = useState(getRandomGradient)
  const { toast } = useToast()

  const handleContextMenu = useCallback((action: string) => {
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(item.url || item.thumbnailUrl || '')
        toast({
          title: 'URL copiada',
          description: 'La URL ha sido copiada al portapapeles'
        })
        break
      // ... otros casos
    }
  }, [item, toast])

  const renderThumbnail = () => {
    if (viewMode === 'list') {
      return (
        <div className="flex items-center gap-3 px-4 h-full">
          <div className="relative w-6 h-6 rounded-sm overflow-hidden bg-muted">
            {item.thumbnailUrl ? (
              <motion.img
                src={item.thumbnailUrl}
                alt={item.name}
                className={cn(
                  "w-full h-full object-cover",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                variants={imageVariants}
                initial="hidden"
                animate={isImageLoaded ? "visible" : "hidden"}
                onLoad={() => setIsImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {item.type === 'image' ? (
                  <Eye className="w-4 h-4" />
                ) : item.type === 'video' ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(item.size)}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-full h-full">
        <div className={cn(
          "relative w-full aspect-square overflow-hidden rounded-lg border border-accent/10 transition-all",
          (isHovered || isSelected) && "border-2 border-white/60"
        )}>
          {item.thumbnailUrl ? (
            <motion.img
              src={item.thumbnailUrl}
              alt={item.name}
              className={cn(
                "w-full h-full object-cover transition-all duration-200",
                isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
                item.metadata?.orientation === 'portrait' && "object-contain"
              )}
              variants={imageVariants}
              initial="hidden"
              animate={isImageLoaded ? "visible" : "hidden"}
              onLoad={() => setIsImageLoaded(true)}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              gradient
            )}>
              <div className="absolute inset-0 flex items-center justify-center">
                {item.type === 'image' ? (
                  <Eye className="w-8 h-8" />
                ) : item.type === 'video' ? (
                  <Play className="w-8 h-8" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>
            </div>
          )}
          <motion.div
            className={cn(
              "absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent",
              "border-t border-white/20",
              isSelected ? "opacity-100" : "opacity-0"
            )}
            variants={overlayVariants}
            initial="hidden"
            animate={isHovered || isSelected ? "visible" : "hidden"}
          >
            <p className="text-sm text-white truncate">{item.name}</p>
            <p className="text-xs text-white/60">{formatFileSize(item.size)}</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <FileContextMenu
      file={item}
      onAction={handleContextMenu}
    >
      <motion.div
        className={cn(
          "group relative transition-all",
          viewMode === 'grid' && "w-full h-full"
        )}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderThumbnail()}
      </motion.div>
    </FileContextMenu>
  )
}

function getThumbnailSizeClass(size: ThumbnailSize) {
  switch (size) {
    case 'small':
      return 'w-[120px] h-[120px]'
    case 'large':
      return 'w-[280px] h-[280px]'
    default:
      return 'w-[180px] h-[180px]'
  }
}