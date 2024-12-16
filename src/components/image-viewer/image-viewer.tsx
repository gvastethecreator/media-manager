'use client'

import { useImageViewer } from '@/store/image-viewer'
import { AdvancedImageViewer } from './advanced-image-viewer'
import type { FileItem } from '@/store/files'

export function ImageViewer() {
  const { isOpen, images, currentIndex, closeViewer } = useImageViewer()

  // Asegurarnos de que solo mostramos imágenes válidas
  const validImages = images.filter((img): img is FileItem & { url: string } =>
    Boolean(img.url || img.thumbnailUrl)
  )

  const mappedImages = validImages.map(img => ({
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

  if (!mappedImages.length || !isOpen) return null

  return (
    <AdvancedImageViewer
      images={mappedImages}
      initialIndex={Math.min(currentIndex, mappedImages.length - 1)}
      isOpen={isOpen}
      onClose={closeViewer}
    />
  )
}