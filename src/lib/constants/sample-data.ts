import { FileItem } from "@/components/right-panel/right-panel"

// Tipos de vista disponibles
export type ViewType = 'grid' | 'list' | 'details'
export type ThumbnailSize = 'small' | 'medium' | 'large'
export type ViewMode = 'collections' | 'folders' | 'tags'

// Datos de ejemplo para las colecciones
export const sampleCollections = [
  {
    id: '1',
    name: "Vacaciones 2023",
    emoji: "🏖️",
    description: "Fotos de las vacaciones de verano",
    count: 145,
    totalSize: "1.2 GB",
    color: "#ff9800",
    thumbnails: Array(9).fill("https://picsum.photos/seed/vacation/400"),
    tags: ["Playa", "Familia", "Verano"]
  },
  {
    id: '2',
    name: "Cumpleaños",
    emoji: "🎂",
    description: "Celebraciones de cumpleaños",
    count: 67,
    totalSize: "500 MB",
    color: "#e91e63",
    thumbnails: Array(9).fill("https://picsum.photos/seed/birthday/400"),
    tags: ["Fiesta", "Amigos", "Celebración"]
  },
  {
    id: '3',
    name: "Navidad",
    emoji: "🎄",
    description: "Celebraciones navideñas",
    count: 89,
    totalSize: "750 MB",
    color: "#4caf50",
    thumbnails: Array(9).fill("https://picsum.photos/seed/christmas/400"),
    tags: ["Familia", "Fiesta", "Invierno"]
  }
]

// Datos de ejemplo para las carpetas
export const sampleFolders = [
  {
    id: '1',
    name: "Documentos",
    icon: "folder",
    description: "Documentos importantes",
    count: 56,
    totalSize: "100 MB",
    color: "#2196f3",
    thumbnails: Array(9).fill("https://picsum.photos/seed/docs/400"),
    children: [
      {
        id: 'd1',
        name: "Contratos",
        type: "folder",
        count: 15,
        size: "25 MB",
        dateCreated: "2024-01-10T09:00:00",
        dateModified: "2024-01-20T14:30:00",
        children: []
      },
      {
        id: 'd2',
        name: "Facturas",
        type: "folder",
        count: 28,
        size: "45 MB",
        dateCreated: "2024-01-15T11:20:00",
        dateModified: "2024-01-22T16:45:00",
        children: []
      },
      {
        id: 'd3',
        name: "Presupuestos",
        type: "folder",
        count: 13,
        size: "30 MB",
        dateCreated: "2024-01-18T10:00:00",
        dateModified: "2024-01-25T11:30:00",
        children: []
      }
    ]
  },
  {
    id: '2',
    name: "Imágenes",
    icon: "folder",
    description: "Todas las imágenes",
    count: 412,
    totalSize: "2.5 GB",
    color: "#4caf50",
    thumbnails: Array(9).fill("https://picsum.photos/seed/images/400"),
    children: [
      {
        id: 'i1',
        name: "Paisajes",
        type: "folder",
        count: 156,
        size: "1.2 GB",
        dateCreated: "2024-01-05T08:00:00",
        dateModified: "2024-01-25T17:30:00",
        children: []
      },
      {
        id: 'i2',
        name: "Retratos",
        type: "folder",
        count: 89,
        size: "750 MB",
        dateCreated: "2024-01-08T14:20:00",
        dateModified: "2024-01-24T11:45:00",
        children: []
      },
      {
        id: 'i3',
        name: "Eventos",
        type: "folder",
        count: 167,
        size: "550 MB",
        dateCreated: "2024-01-12T09:30:00",
        dateModified: "2024-01-23T16:20:00",
        children: []
      }
    ]
  },
  {
    id: '3',
    name: "Proyectos",
    icon: "folder",
    description: "Proyectos en curso",
    count: 23,
    totalSize: "1.8 GB",
    color: "#ff5722",
    thumbnails: Array(9).fill("https://picsum.photos/seed/projects/400"),
    children: [
      {
        id: 'p1',
        name: "Proyecto Web",
        type: "folder",
        count: 12,
        size: "800 MB",
        dateCreated: "2024-01-02T10:00:00",
        dateModified: "2024-01-25T15:30:00",
        children: []
      },
      {
        id: 'p2',
        name: "App Móvil",
        type: "folder",
        count: 11,
        size: "1 GB",
        dateCreated: "2024-01-15T09:00:00",
        dateModified: "2024-01-24T14:20:00",
        children: []
      }
    ]
  }
]

// Datos de ejemplo para las etiquetas
export const sampleTags = [
  {
    id: '1',
    name: "Favoritos",
    color: "#f44336",
    description: "Elementos marcados como favoritos",
    count: 50,
    totalSize: "750 MB",
    thumbnails: Array(9).fill("https://picsum.photos/seed/favorites/400")
  },
  {
    id: '2',
    name: "Trabajo",
    color: "#9c27b0",
    description: "Archivos relacionados con el trabajo",
    count: 203,
    totalSize: "1.5 GB",
    thumbnails: Array(9).fill("https://picsum.photos/seed/work/400")
  },
  {
    id: '3',
    name: "Familia",
    color: "#4caf50",
    description: "Momentos familiares",
    count: 156,
    totalSize: "1.2 GB",
    thumbnails: Array(9).fill("https://picsum.photos/seed/family/400")
  }
]

// Datos de ejemplo para la vista de archivos
export const sampleFiles: FileItem[] = [
  // Carpetas
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `folder-${i + 1}`,
    name: `Carpeta ${i + 1}`,
    type: 'folder' as const,
    size: `${Math.floor(Math.random() * 500) + 100} MB`,
    dateCreated: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    dateModified: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
    children: Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, j) => ({
      id: `folder-${i + 1}-file-${j + 1}`,
      name: `Archivo ${j + 1}`,
      type: 'image' as const,
      size: `${Math.floor(Math.random() * 10) + 1} MB`,
      dateCreated: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      dateModified: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
      thumbnail: `https://picsum.photos/seed/file${i}${j}/400`,
      dimensions: `${1920 + j}x${1080 + j}`,
      metadata: {
        camera: ['Canon EOS R5', 'Sony A7 IV', 'Nikon Z6 II'][Math.floor(Math.random() * 3)],
        lens: ['24-70mm f/2.8', '70-200mm f/2.8', '50mm f/1.4'][Math.floor(Math.random() * 3)],
        focalLength: ['24mm', '50mm', '70mm', '200mm'][Math.floor(Math.random() * 4)],
        aperture: ['f/1.4', 'f/2.8', 'f/4', 'f/8'][Math.floor(Math.random() * 4)],
        shutterSpeed: ['1/1000', '1/500', '1/250', '1/125'][Math.floor(Math.random() * 4)],
        iso: ['100', '200', '400', '800'][Math.floor(Math.random() * 4)],
        location: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'][Math.floor(Math.random() * 4)],
        tags: ['viaje', 'naturaleza', 'ciudad', 'retrato', 'paisaje'][Math.floor(Math.random() * 5)].split(','),
        rating: Math.floor(Math.random() * 2) + 4
      }
    }))
  })),
  // Imágenes sueltas
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `image-${i + 1}`,
    name: `Imagen ${i + 1}.jpg`,
    type: 'image' as const,
    size: `${Math.floor(Math.random() * 10) + 1} MB`,
    dateCreated: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    dateModified: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
    thumbnail: `https://picsum.photos/seed/image${i}/400`,
    dimensions: `${1920 + i}x${1080 + i}`,
    metadata: {
      camera: ['Canon EOS R5', 'Sony A7 IV', 'Nikon Z6 II'][Math.floor(Math.random() * 3)],
      lens: ['24-70mm f/2.8', '70-200mm f/2.8', '50mm f/1.4'][Math.floor(Math.random() * 3)],
      focalLength: ['24mm', '50mm', '70mm', '200mm'][Math.floor(Math.random() * 4)],
      aperture: ['f/1.4', 'f/2.8', 'f/4', 'f/8'][Math.floor(Math.random() * 4)],
      shutterSpeed: ['1/1000', '1/500', '1/250', '1/125'][Math.floor(Math.random() * 4)],
      iso: ['100', '200', '400', '800'][Math.floor(Math.random() * 4)],
      location: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'][Math.floor(Math.random() * 4)],
      tags: ['viaje', 'naturaleza', 'ciudad', 'retrato', 'paisaje'][Math.floor(Math.random() * 5)].split(','),
      rating: Math.floor(Math.random() * 2) + 4
    }
  }))
]

// Datos de ejemplo para las vistas
export const sampleViewData: Record<ViewMode, Record<string, FileItem[]>> = {
  collections: {
    '1': sampleFiles.slice(0, 10),
    '2': sampleFiles.slice(10, 15),
    '3': sampleFiles.slice(15, 20)
  },
  folders: {
    '1': sampleFiles.slice(0, 8),
    '2': sampleFiles.slice(8, 16),
    '3': sampleFiles.slice(16, 25)
  },
  tags: {
    'Favoritos': sampleFiles.slice(0, 12),
    'Trabajo': sampleFiles.slice(12, 18),
    'Familia': sampleFiles.slice(18, 25)
  }
}

// Estadísticas generales
export const sampleStats = {
  totalCollections: sampleCollections.length,
  totalFolders: sampleFolders.length,
  totalTags: sampleTags.length,
  totalFiles: sampleFiles.length,
  totalStorage: "5.2 GB",
  lastUpdate: new Date().toISOString()
}