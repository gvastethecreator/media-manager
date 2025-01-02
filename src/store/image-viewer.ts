import { create } from 'zustand'
import type { FileItem } from '@/types/file-item'

interface ImageViewerState {
  isOpen: boolean
  images: FileItem[]
  currentIndex: number
  openViewer: (images: FileItem[], initialIndex?: number) => void
  closeViewer: () => void
  nextImage: () => void
  previousImage: () => void
  setCurrentIndex: (index: number) => void
}

export const useImageViewer = create<ImageViewerState>((set, get) => ({
  isOpen: false,
  images: [],
  currentIndex: 0,

  openViewer: (images, initialIndex = 0) => {
    set({
      isOpen: true,
      images,
      currentIndex: initialIndex
    })
  },

  closeViewer: () => {
    set({
      isOpen: false,
      images: [],
      currentIndex: 0
    })
  },

  nextImage: () => {
    const { images, currentIndex } = get()
    if (currentIndex < images.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  previousImage: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  setCurrentIndex: (index) => {
    const { images } = get()
    if (index >= 0 && index < images.length) {
      set({ currentIndex: index })
    }
  }
}))