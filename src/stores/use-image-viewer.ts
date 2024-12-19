import { create } from 'zustand'
import { FileItem } from '@/types'

interface ImageViewerStore {
  isOpen: boolean
  images: FileItem[]
  currentIndex: number
  openViewer: (images: FileItem[], initialIndex?: number) => void
  closeViewer: () => void
  setCurrentIndex: (index: number) => void
}

export const useImageViewer = create<ImageViewerStore>((set) => ({
  isOpen: false,
  images: [],
  currentIndex: 0,
  openViewer: (images: FileItem[], initialIndex = 0) =>
    set({
      isOpen: true,
      images,
      currentIndex: initialIndex,
    }),
  closeViewer: () =>
    set({
      isOpen: false,
      images: [],
      currentIndex: 0,
    }),
  setCurrentIndex: (index: number) =>
    set({
      currentIndex: index,
    }),
}))
