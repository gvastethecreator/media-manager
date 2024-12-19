'use client'

import { useMemo } from 'react'
import { useImageViewer } from '@/store/image-viewer'
import dynamic from 'next/dynamic'
import type { FileItem } from '@/types/file-item'

// Lazy load del AdvancedImageViewer
const AdvancedImageViewer = dynamic(
  () => import('./components/advanced-image-viewer').then(mod => mod.AdvancedImageViewer),
  {
    loading: () => null,
    ssr: false
  }
)

export function ImageViewer() {
  const { isOpen, images, currentIndex, closeViewer } = useImageViewer()

  // Optimizamos el mapeo de imágenes con useMemo
  const mappedImages = useMemo(() => {
    if (!images || !images.length) return []

    return images.map(img => ({
      id: img.id,
      name: img.name,
      type: 'image' as const,
      thumbnail: img.thumbnailUrl || '',
      src: img.previewUrl || img.thumbnailUrl || '',
      alt: img.name,
      width: img.metadata?.dimensions?.width,
      height: img.metadata?.dimensions?.height,
      mimeType: img.mimeType
    }))
  }, [images])

  // Si no hay imágenes o el visor está cerrado, no renderizamos nada
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