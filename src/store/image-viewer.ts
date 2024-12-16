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

export const useImageViewer = create<ImageViewerState>((set, get) => ({
  isOpen: false,
  currentImage: null,
  images: [],
  currentIndex: 0,
  openViewer: (image, allImages) => {
    console.log('Opening viewer with:', {
      image,
      hasUrl: !!image.url,
      hasThumbnail: !!image.thumbnailUrl,
      totalImages: allImages?.length,
      currentState: get()
    })

    if (!image.url && !image.thumbnailUrl) {
      console.warn('Cannot open viewer: image has no URL')
      return
    }

    if (!image.mimeType?.startsWith('image/') && !image.mimeType?.startsWith('video/')) {
      console.warn('Cannot open viewer: unsupported file type:', image.mimeType)
      return
    }

    const validImages = (allImages || [image]).filter(img =>
      (img.url || img.thumbnailUrl) &&
      (img.mimeType?.startsWith('image/') || img.mimeType?.startsWith('video/'))
    )

    console.log('Valid images for viewer:', validImages.length)

    const currentIndex = validImages.findIndex(img => img.id === image.id)
    console.log('Current index in viewer:', currentIndex)

    if (currentIndex === -1) {
      console.warn('Image not found in valid images')
      return
    }

    set({
      isOpen: true,
      currentImage: image,
      images: validImages,
      currentIndex: currentIndex
    })

    console.log('Viewer state after update:', get())
  },
  closeViewer: () => {
    console.log('Closing viewer, current state:', get())
    set({
      isOpen: false,
      currentImage: null,
      images: [],
      currentIndex: 0
    })
  },
  setCurrentImage: (image) => {
    const state = get()
    console.log('Setting current image:', { image, currentState: state })

    if (!image.url && !image.thumbnailUrl) {
      console.warn('Cannot set current image: no URL available')
      return
    }

    const currentIndex = state.images.findIndex(img => img.id === image.id)

    if (currentIndex === -1) {
      console.warn('Image not found in current images')
      return
    }

    set({
      currentImage: image,
      currentIndex: currentIndex
    })

    console.log('State after setting image:', get())
  },
  setImages: (images) => {
    console.log('Setting images:', { count: images.length, currentState: get() })
    const validImages = images.filter(img =>
      (img.url || img.thumbnailUrl) &&
      (img.mimeType?.startsWith('image/') || img.mimeType?.startsWith('video/'))
    )
    console.log('Valid images after filtering:', validImages.length)
    set({ images: validImages })
  },
  setCurrentIndex: (currentIndex) => {
    const state = get()
    console.log('Setting current index:', {
      requestedIndex: currentIndex,
      currentState: state
    })

    const safeIndex = Math.max(0, Math.min(currentIndex, state.images.length - 1))
    const newImage = state.images[safeIndex] || null

    set({
      currentIndex: safeIndex,
      currentImage: newImage
    })

    console.log('State after setting index:', get())
  }
}))