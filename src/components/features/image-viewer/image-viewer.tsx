'use client'

import { useMemo } from 'react'
import { useImageViewer } from '@/store/image-viewer'
import dynamic from 'next/dynamic'
import type { FileItem } from '@/store/files'

// Lazy load del AdvancedImageViewer
const AdvancedImageViewer = dynamic(
  () => import('./components/advanced-image-viewer').then(mod => mod.AdvancedImageViewer),
  {
    loading: () => null, // El componente ya tiene su propio loading state
    ssr: false // Este componente solo debe renderizarse en el cliente
  }
)

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