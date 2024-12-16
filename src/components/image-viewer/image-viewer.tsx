'use client'

import { useMemo } from 'react'
import { useImageViewer } from '@/store/image-viewer'
import { AdvancedImageViewer } from './advanced-image-viewer'
import type { FileItem } from '@/store/files'

export function ImageViewer() {
  const { isOpen, images, currentIndex, closeViewer } = useImageViewer()

  // Optimizamos el filtrado y mapeo de imágenes con useMemo
  const mappedImages = useMemo(() => {
    const validImages = images.filter((img): img is FileItem & { url: string } =>
      Boolean(img.url || img.thumbnailUrl)
    )

    return validImages.map(img => ({
      id: img.id,
      name: img.name,
      type: 'image' as const,
      thumbnail: img.thumbnailUrl || img.url,
      src: img.url || img.thumbnailUrl,
      alt: img.name,
      width: img.width,
      height: img.height,
      duration: img.duration,
      fps: img.fps,
      mimeType: img.mimeType
    }))
  }, [images])

  if (!mappedImages.length || !isOpen) {
    return null
  }

  return (
    <AdvancedImageViewer
      images={mappedImages}
      initialIndex={Math.min(currentIndex, mappedImages.length - 1)}
      isOpen={isOpen}
      onClose={closeViewer}
    />
  )
}