import type { Collection, FileItem, Folder, Tag } from '@/store/files'

// Helper para generar URLs de imágenes aleatorias
const getRandomImage = (index: number, width = 400, height = 300) =>
  `https://picsum.photos/${width}/${height}?random=${index}`

// Helper para generar fechas aleatorias recientes
const getRandomDate = () => {
  const start = new Date('2023-01-01')
  const end = new Date()
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export const mockCollections: Collection[] = [
  {
    id: 'c1',
    name: 'Vacaciones 2023',
    description: 'Fotos y videos de las vacaciones en la playa',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 1)),
    count: 156,
    totalSize: 1024 * 1024 * 500, // 500MB
    tags: ['playa', 'verano', 'familia'],
    color: '#ef4444',
    emoji: '🏖️'
  },
  {
    id: 'c2',
    name: 'Fotografía',
    description: 'Sesiones fotográficas y ediciones',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 5)),
    count: 42,
    totalSize: 1024 * 1024 * 800, // 800MB
    tags: ['fotografía', 'retratos', 'edición'],
    color: '#0ea5e9',
    emoji: '📸'
  },
  {
    id: 'c3',
    name: 'Eventos Familiares',
    description: 'Fotos y videos de eventos familiares',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 9)),
    count: 324,
    totalSize: 1024 * 1024 * 800, // 800MB
    tags: ['familia', 'eventos', 'cumpleaños'],
    color: '#22c55e',
    emoji: '👨‍👩‍👧‍👦'
  },
  {
    id: 'c4',
    name: 'Animaciones',
    description: 'GIFs y videos cortos',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 13)),
    count: 89,
    totalSize: 1024 * 1024 * 250, // 250MB
    tags: ['gif', 'animación', 'videos'],
    color: '#8b5cf6',
    emoji: '🎬'
  },
  {
    id: 'c5',
    name: 'Viajes',
    description: 'Fotos y videos de viajes',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 17)),
    count: 567,
    totalSize: 1024 * 1024 * 1200, // 1.2GB
    tags: ['viajes', 'paisajes', 'aventuras'],
    color: '#f59e0b',
    emoji: '✈️'
  }
]

export const mockFolders: Folder[] = [
  {
    id: 'f1',
    name: 'Fotos 2023',
    description: 'Fotografías del año',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 21)),
    count: 250,
    totalSize: 1024 * 1024 * 500, // 500MB
    color: '#f59e0b'
  },
  {
    id: 'f2',
    name: 'Videos HD',
    description: 'Videos en alta definición',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 25)),
    count: 48,
    totalSize: 1024 * 1024 * 2000, // 2GB
    color: '#8b5cf6'
  },
  {
    id: 'f3',
    name: 'GIFs',
    description: 'Colección de GIFs animados',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 29)),
    count: 145,
    totalSize: 1024 * 1024 * 300, // 300MB
    color: '#ec4899'
  },
  {
    id: 'f4',
    name: 'Reels',
    description: 'Videos cortos y clips',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 33)),
    count: 82,
    totalSize: 1024 * 1024 * 1500, // 1.5GB
    color: '#06b6d4'
  }
]

export const mockTags: Tag[] = [
  {
    id: 't1',
    name: 'familia',
    description: 'Momentos familiares',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 37)),
    count: 245,
    totalSize: 1024 * 1024 * 600, // 600MB
    color: '#ec4899'
  },
  {
    id: 't2',
    name: 'paisajes',
    description: 'Fotografías de paisajes',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 41)),
    count: 89,
    totalSize: 1024 * 1024 * 450, // 450MB
    color: '#06b6d4'
  },
  {
    id: 't3',
    name: 'retratos',
    description: 'Fotografías de personas',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 45)),
    count: 178,
    totalSize: 1024 * 1024 * 400, // 400MB
    color: '#f43f5e'
  },
  {
    id: 't4',
    name: 'eventos',
    description: 'Fotos y videos de eventos',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 49)),
    count: 134,
    totalSize: 1024 * 1024 * 800, // 800MB
    color: '#8b5cf6'
  },
  {
    id: 't5',
    name: 'animaciones',
    description: 'GIFs y videos cortos',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 53)),
    count: 67,
    totalSize: 1024 * 1024 * 200, // 200MB
    color: '#f59e0b'
  }
]

// Generar más archivos de prueba
const generateMockFiles = () => {
  const files: FileItem[] = []
  const fileTypes = [
    {
      ext: '.jpg',
      prefix: 'IMG_',
      tags: ['fotografía'],
      mimeType: 'image/jpeg',
      sizes: { min: 1024 * 500, max: 1024 * 1024 * 5 }, // 500KB - 5MB
      dimensions: { min: 1000, max: 3000 }
    },
    {
      ext: '.png',
      prefix: 'Photo_',
      tags: ['fotografía'],
      mimeType: 'image/png',
      sizes: { min: 1024 * 800, max: 1024 * 1024 * 8 }, // 800KB - 8MB
      dimensions: { min: 1000, max: 3000 }
    },
    {
      ext: '.gif',
      prefix: 'GIF_',
      tags: ['animación'],
      mimeType: 'image/gif',
      sizes: { min: 1024 * 100, max: 1024 * 1024 * 2 }, // 100KB - 2MB
      dimensions: { min: 400, max: 800 },
      fps: { min: 24, max: 60 },
      duration: { min: 1, max: 10 }
    },
    {
      ext: '.mp4',
      prefix: 'VID_',
      tags: ['video'],
      mimeType: 'video/mp4',
      sizes: { min: 1024 * 1024 * 5, max: 1024 * 1024 * 50 }, // 5MB - 50MB
      dimensions: { min: 1280, max: 3840 }, // hasta 4K
      fps: { min: 30, max: 60 },
      duration: { min: 10, max: 300 } // 10s - 5min
    },
    {
      ext: '.webm',
      prefix: 'CLIP_',
      tags: ['video'],
      mimeType: 'video/webm',
      sizes: { min: 1024 * 1024 * 2, max: 1024 * 1024 * 20 }, // 2MB - 20MB
      dimensions: { min: 1280, max: 1920 }, // hasta 1080p
      fps: { min: 30, max: 60 },
      duration: { min: 5, max: 60 } // 5s - 1min
    }
  ]

  // Generar 50 archivos aleatorios
  for (let i = 0; i < 50; i++) {
    const typeIndex = Math.floor(Math.random() * fileTypes.length)
    const fileType = fileTypes[typeIndex]
    const collectionIndex = Math.floor(Math.random() * mockCollections.length)
    const collection = mockCollections[collectionIndex]

    // Generar dimensiones aleatorias
    const width = Math.floor(Math.random() * (fileType.dimensions.max - fileType.dimensions.min)) + fileType.dimensions.min
    const height = Math.floor(Math.random() * (fileType.dimensions.max - fileType.dimensions.min)) + fileType.dimensions.min

    // Propiedades base del archivo
    const baseFile = {
      id: `file${i + 1}`,
      name: `${fileType.prefix}${String(i + 1).padStart(3, '0')}${fileType.ext}`,
      type: 'file' as const,
      path: `/${collection.name}/${fileType.prefix}${String(i + 1).padStart(3, '0')}${fileType.ext}`,
      size: Math.floor(Math.random() * (fileType.sizes.max - fileType.sizes.min) + fileType.sizes.min),
      modified: getRandomDate(),
      created: getRandomDate(),
      mimeType: fileType.mimeType,
      width,
      height,
      tags: [...fileType.tags, ...collection.tags.slice(0, Math.floor(Math.random() * collection.tags.length + 1))]
    }

    // Añadir propiedades específicas según el tipo de archivo
    const isVideo = fileType.mimeType.startsWith('video/')
    const isGif = fileType.ext === '.gif'

    const specificProps = {
      url: isVideo
        ? `https://example.com/videos/${i + 1}${fileType.ext}`
        : getRandomImage(i + 57, width, height),
      thumbnailUrl: getRandomImage(i + 57, 400, 300),
      ...(isVideo || isGif ? {
        fps: Math.floor(Math.random() * (fileType.fps!.max - fileType.fps!.min)) + fileType.fps!.min,
        duration: Math.floor(Math.random() * (fileType.duration!.max - fileType.duration!.min)) + fileType.duration!.min
      } : {})
    }

    files.push({
      ...baseFile,
      ...specificProps
    })
  }

  return files
}

export const mockFiles = generateMockFiles()

export const mockStats = {
  totalFiles: mockFiles.length,
  totalCollections: mockCollections.length,
  totalFolders: mockFolders.length,
  totalTags: mockTags.length,
  totalSize: mockFiles.reduce((acc, file) => acc + file.size, 0)
}