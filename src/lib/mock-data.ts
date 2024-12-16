import type { Collection, FileItem, Folder, Tag } from '@/store/files'

// Helper para generar URLs de imágenes aleatorias
const getRandomImage = (index: number) => `https://picsum.photos/400/300?random=${index}`

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
    description: 'Fotos de las vacaciones en la playa',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 1)),
    count: 156,
    totalSize: 1024 * 1024 * 500, // 500MB
    tags: ['playa', 'verano', 'familia'],
    color: '#ef4444',
    emoji: '🏖️'
  },
  {
    id: 'c2',
    name: 'Trabajo',
    description: 'Capturas de pantalla y documentos del trabajo',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 5)),
    count: 42,
    totalSize: 1024 * 1024 * 100, // 100MB
    tags: ['trabajo', 'documentos'],
    color: '#0ea5e9',
    emoji: '💼'
  },
  {
    id: 'c3',
    name: 'Familia',
    description: 'Fotos familiares y eventos',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 9)),
    count: 324,
    totalSize: 1024 * 1024 * 800, // 800MB
    tags: ['familia', 'eventos', 'cumpleaños'],
    color: '#22c55e',
    emoji: '👨‍👩‍👧‍👦'
  },
  {
    id: 'c4',
    name: 'Proyectos',
    description: 'Documentación y recursos de proyectos',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 13)),
    count: 89,
    totalSize: 1024 * 1024 * 250, // 250MB
    tags: ['trabajo', 'proyectos', 'documentos'],
    color: '#8b5cf6',
    emoji: '📊'
  },
  {
    id: 'c5',
    name: 'Viajes',
    description: 'Recuerdos de diferentes viajes',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 17)),
    count: 567,
    totalSize: 1024 * 1024 * 1200, // 1.2GB
    tags: ['viajes', 'vacaciones', 'fotos'],
    color: '#f59e0b',
    emoji: '✈️'
  }
]

export const mockFolders: Folder[] = [
  {
    id: 'f1',
    name: 'Documentos',
    description: 'Documentos importantes',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 21)),
    count: 25,
    totalSize: 1024 * 1024 * 50, // 50MB
    color: '#f59e0b'
  },
  {
    id: 'f2',
    name: 'Descargas',
    description: 'Archivos descargados',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 25)),
    count: 18,
    totalSize: 1024 * 1024 * 200, // 200MB
    color: '#8b5cf6'
  },
  {
    id: 'f3',
    name: 'Música',
    description: 'Biblioteca de música',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 29)),
    count: 145,
    totalSize: 1024 * 1024 * 1500, // 1.5GB
    color: '#ec4899'
  },
  {
    id: 'f4',
    name: 'Videos',
    description: 'Colección de videos',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 33)),
    count: 32,
    totalSize: 1024 * 1024 * 4000, // 4GB
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
    name: 'trabajo',
    description: 'Relacionado con el trabajo',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 41)),
    count: 89,
    totalSize: 1024 * 1024 * 150, // 150MB
    color: '#06b6d4'
  },
  {
    id: 't3',
    name: 'vacaciones',
    description: 'Momentos de descanso',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 45)),
    count: 178,
    totalSize: 1024 * 1024 * 400, // 400MB
    color: '#f43f5e'
  },
  {
    id: 't4',
    name: 'proyectos',
    description: 'Archivos de proyectos',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 49)),
    count: 134,
    totalSize: 1024 * 1024 * 300, // 300MB
    color: '#8b5cf6'
  },
  {
    id: 't5',
    name: 'documentos',
    description: 'Documentos importantes',
    thumbnails: Array.from({ length: 4 }, (_, i) => getRandomImage(i + 53)),
    count: 67,
    totalSize: 1024 * 1024 * 100, // 100MB
    color: '#f59e0b'
  }
]

// Generar más archivos de prueba
const generateMockFiles = () => {
  const files: FileItem[] = []
  const fileTypes = [
    { ext: '.jpg', prefix: 'IMG_', tags: ['fotos'] },
    { ext: '.png', prefix: 'Screenshot_', tags: ['capturas'] },
    { ext: '.pdf', prefix: 'Doc_', tags: ['documentos'] },
    { ext: '.mp4', prefix: 'Video_', tags: ['videos'] },
    { ext: '.mp3', prefix: 'Audio_', tags: ['música'] }
  ]

  // Generar 50 archivos aleatorios
  for (let i = 0; i < 50; i++) {
    const typeIndex = Math.floor(Math.random() * fileTypes.length)
    const { ext, prefix, tags } = fileTypes[typeIndex]
    const collectionIndex = Math.floor(Math.random() * mockCollections.length)
    const collection = mockCollections[collectionIndex]

    files.push({
      id: `file${i + 1}`,
      name: `${prefix}${String(i + 1).padStart(3, '0')}${ext}`,
      type: 'file',
      path: `/${collection.name}/${prefix}${String(i + 1).padStart(3, '0')}${ext}`,
      size: Math.random() * 1024 * 1024 * 10, // 0-10MB
      modified: getRandomDate(),
      created: getRandomDate(),
      thumbnailUrl: getRandomImage(i + 57),
      tags: [...tags, ...collection.tags.slice(0, Math.floor(Math.random() * collection.tags.length + 1))]
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