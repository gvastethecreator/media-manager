import { create } from 'zustand'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'

const viewerLogger = logger.withContext('ImageViewer')

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
    const state = get()
    if (state.isOpen && state.images === images && state.currentIndex === initialIndex) {
      viewerLogger.info('🔄 El visor ya está abierto con las mismas imágenes')
      return
    }

    viewerLogger.info('🖼️ Abriendo visor con', images.length, 'imágenes')
    set({
      isOpen: true,
      images,
      currentIndex: initialIndex
    })
  },

  closeViewer: () => {
    const state = get()
    if (!state.isOpen) {
      viewerLogger.info('🚫 El visor ya está cerrado')
      return
    }

    viewerLogger.info('🚪 Cerrando visor')
    set({
      isOpen: false,
      images: [],
      currentIndex: 0
    })
  },

  nextImage: () => {
    const { images, currentIndex } = get()
    if (currentIndex < images.length - 1) {
      viewerLogger.info('⏭️ Siguiente imagen:', currentIndex + 1)
      set({ currentIndex: currentIndex + 1 })
    } else {
      viewerLogger.info('🔚 Ya estás en la última imagen')
    }
  },

  previousImage: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      viewerLogger.info('⏮️ Imagen anterior:', currentIndex - 1)
      set({ currentIndex: currentIndex - 1 })
    } else {
      viewerLogger.info('🔝 Ya estás en la primera imagen')
    }
  },

  setCurrentIndex: (index) => {
    const { images } = get()
    if (index >= 0 && index < images.length) {
      viewerLogger.info('🔄 Cambiando a imagen:', index)
      set({ currentIndex: index })
    } else {
      viewerLogger.warn('⚠️ Índice fuera de rango:', index)
    }
  }
}))