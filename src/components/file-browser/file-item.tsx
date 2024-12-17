'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { FileContextMenu } from './context-menu'
import { Copy, Download, Eye, Share2, Trash2, Play, AlertCircle } from 'lucide-react'
import type { FileItem } from '@/store/files'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/format'
import { useToast } from '@/components/ui/use-toast'
import { useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface FileCardProps {
  item: FileItem
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onClick: () => void
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
  isSelected,
  onClick
}: FileCardProps) {
  const { toast } = useToast()
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [gradient] = useState(getRandomGradient())

  const handleContextMenu = useCallback((action: string) => {
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(item.path).then(() => {
          toast({
            title: "Copiado al portapapeles",
            description: item.path
          })
        })
        break
      case 'preview':
        // Implementar acción de vista previa
        break
      // Implementar otras acciones
    }
  }, [item, toast])

  const renderThumbnail = () => {
    if (viewMode === 'list') {
      return (
        <div className="flex items-center gap-3 px-4">
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
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br">
        {item.thumbnailUrl ? (
          <motion.img
            src={item.thumbnailUrl}
            alt={item.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-200",
              isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
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
          className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent"
          variants={overlayVariants}
          initial="hidden"
          animate={isHovered ? "visible" : "hidden"}
        >
          <p className="text-sm text-white truncate">{item.name}</p>
          <p className="text-xs text-white/80">{formatFileSize(item.size)}</p>
        </motion.div>
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
          "group relative rounded-lg border transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent/50 text-accent-foreground",
          viewMode === 'grid' ? 'aspect-square p-2' : 'h-12 p-2'
        )}
        onClick={onClick}
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