import { create } from 'zustand'
import type { FileItem } from './files'

interface ImageViewerState {
  isOpen: boolean
  currentImage: FileItem | null
  images: FileItem[]
  currentIndex: number
  openViewer: (image: FileItem, allImages?: FileItem[]) => void
  closeViewer: () => void
  setCurrentImage: (image: FileItem) => void
  setImages: (images: FileItem[]) => void
  setCurrentIndex: (index: number) => void
}

export const useImageViewer = create<ImageViewerState>((set) => ({
  isOpen: false,
  currentImage: null,
  images: [],
  currentIndex: 0,
  openViewer: (image, allImages) => {
    console.log('Opening viewer with:', { image, allImages }) // Debug
    set(() => {
      const validImages = (allImages || [image]).filter(img =>
        Boolean(img.url || img.thumbnailUrl)
      )
      const currentIndex = validImages.findIndex(img => img.id === image.id)

      return {
        isOpen: true,
        currentImage: image,
        images: validImages,
        currentIndex: Math.max(0, currentIndex)
      }
    })
  },
  closeViewer: () => {
    console.log('Closing viewer') // Debug
    set({
      isOpen: false,
      currentImage: null,
      images: [],
      currentIndex: 0
    })
  },
  setCurrentImage: (image) => set((state) => {
    const currentIndex = state.images.findIndex(img => img.id === image.id)
    return {
      currentImage: image,
      currentIndex: Math.max(0, currentIndex)
    }
  }),
  setImages: (images) => set({
    images: images.filter(img => Boolean(img.url || img.thumbnailUrl))
  }),
  setCurrentIndex: (currentIndex) => set((state) => {
    const safeIndex = Math.max(0, Math.min(currentIndex, state.images.length - 1))
    return {
      currentIndex: safeIndex,
      currentImage: state.images[safeIndex] || null
    }
  })
}))