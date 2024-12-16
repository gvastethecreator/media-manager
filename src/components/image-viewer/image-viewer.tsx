'use client'

import { useImageViewer } from '@/store/image-viewer'
import { AdvancedImageViewer } from './advanced-image-viewer'
import type { FileItem } from '@/store/files'

export function ImageViewer() {
  const { isOpen, images, currentIndex, closeViewer } = useImageViewer()

  console.log('ImageViewer render:', {
    isOpen,
    currentIndex,
    totalImages: images.length,
    currentImage: images[currentIndex]
  })

  // Asegurarnos de que solo mostramos imágenes válidas
  const validImages = images.filter((img): img is FileItem & { url: string } =>
    Boolean(img.url || img.thumbnailUrl)
  )

  console.log('Valid images:', validImages.length)

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

  console.log('Mapped images:', mappedImages.length)

  if (!mappedImages.length || !isOpen) {
    console.log('ImageViewer not rendering:', { noImages: !mappedImages.length, notOpen: !isOpen })
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