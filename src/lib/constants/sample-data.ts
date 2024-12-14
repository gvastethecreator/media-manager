import { FileItem } from "@/components/file-view/file-view"

export type ViewMode = 'files' | 'collections' | 'folders' | 'tags' | 'cards'

export const sampleCollections = [
  {
    id: 'collection-1',
    name: 'Vacaciones 2023',
    description: 'Fotos de las vacaciones de verano en la playa',
    thumbnails: [
      'https://picsum.photos/200/300?random=1',
      'https://picsum.photos/200/300?random=2',
      'https://picsum.photos/200/300?random=3',
      'https://picsum.photos/200/300?random=4',
      'https://picsum.photos/200/300?random=5',
      'https://picsum.photos/200/300?random=6',
      'https://picsum.photos/200/300?random=7',
      'https://picsum.photos/200/300?random=8',
      'https://picsum.photos/200/300?random=9',
    ],
    count: 124,
    totalSize: '1.2 GB',
    tags: ['vacaciones', 'playa', 'verano'],
    color: '#FF6B6B',
    emoji: '🏖️'
  },
  {
    id: 'collection-2',
    name: 'Fotografía Urbana',
    description: 'Colección de fotografías de arquitectura y paisajes urbanos',
    thumbnails: [
      'https://picsum.photos/200/300?random=10',
      'https://picsum.photos/200/300?random=11',
      'https://picsum.photos/200/300?random=12',
      'https://picsum.photos/200/300?random=13',
      'https://picsum.photos/200/300?random=14',
      'https://picsum.photos/200/300?random=15',
      'https://picsum.photos/200/300?random=16',
      'https://picsum.photos/200/300?random=17',
      'https://picsum.photos/200/300?random=18',
    ],
    count: 89,
    totalSize: '856 MB',
    tags: ['ciudad', 'arquitectura', 'urbano'],
    color: '#4ECDC4',
    emoji: '🌆'
  },
  {
    id: 'collection-3',
    name: 'Retratos',
    description: 'Sesiones de retratos profesionales',
    thumbnails: [
      'https://picsum.photos/200/300?random=19',
      'https://picsum.photos/200/300?random=20',
      'https://picsum.photos/200/300?random=21',
      'https://picsum.photos/200/300?random=22',
      'https://picsum.photos/200/300?random=23',
      'https://picsum.photos/200/300?random=24',
      'https://picsum.photos/200/300?random=25',
      'https://picsum.photos/200/300?random=26',
      'https://picsum.photos/200/300?random=27',
    ],
    count: 56,
    totalSize: '645 MB',
    tags: ['retratos', 'personas', 'profesional'],
    color: '#FFE66D',
    emoji: '👤'
  }
]

export const sampleFolders = [
  {
    id: 'folder-1',
    name: 'Proyectos 2023',
    description: 'Fotografías de proyectos realizados en 2023',
    thumbnails: [
      'https://picsum.photos/200/300?random=28',
      'https://picsum.photos/200/300?random=29',
      'https://picsum.photos/200/300?random=30',
      'https://picsum.photos/200/300?random=31',
      'https://picsum.photos/200/300?random=32',
      'https://picsum.photos/200/300?random=33',
      'https://picsum.photos/200/300?random=34',
      'https://picsum.photos/200/300?random=35',
      'https://picsum.photos/200/300?random=36',
    ],
    count: 245,
    totalSize: '2.1 GB',
    color: '#6C5CE7'
  },
  {
    id: 'folder-2',
    name: 'Eventos',
    description: 'Fotografías de eventos y celebraciones',
    thumbnails: [
      'https://picsum.photos/200/300?random=37',
      'https://picsum.photos/200/300?random=38',
      'https://picsum.photos/200/300?random=39',
      'https://picsum.photos/200/300?random=40',
      'https://picsum.photos/200/300?random=41',
      'https://picsum.photos/200/300?random=42',
      'https://picsum.photos/200/300?random=43',
      'https://picsum.photos/200/300?random=44',
      'https://picsum.photos/200/300?random=45',
    ],
    count: 178,
    totalSize: '1.5 GB',
    color: '#A8E6CF'
  },
  {
    id: 'folder-3',
    name: 'Personal',
    description: 'Fotografías personales y familiares',
    thumbnails: [
      'https://picsum.photos/200/300?random=46',
      'https://picsum.photos/200/300?random=47',
      'https://picsum.photos/200/300?random=48',
      'https://picsum.photos/200/300?random=49',
      'https://picsum.photos/200/300?random=50',
      'https://picsum.photos/200/300?random=51',
      'https://picsum.photos/200/300?random=52',
      'https://picsum.photos/200/300?random=53',
      'https://picsum.photos/200/300?random=54',
    ],
    count: 312,
    totalSize: '2.8 GB',
    color: '#FF9A9E'
  }
]

export const sampleTags = [
  {
    id: 'tag-1',
    name: 'naturaleza',
    description: 'Fotografías de paisajes y naturaleza',
    thumbnails: [
      'https://picsum.photos/200/300?random=55',
      'https://picsum.photos/200/300?random=56',
      'https://picsum.photos/200/300?random=57',
      'https://picsum.photos/200/300?random=58',
      'https://picsum.photos/200/300?random=59',
      'https://picsum.photos/200/300?random=60',
      'https://picsum.photos/200/300?random=61',
      'https://picsum.photos/200/300?random=62',
      'https://picsum.photos/200/300?random=63',
    ],
    count: 145,
    totalSize: '1.3 GB',
    color: '#95E1D3'
  },
  {
    id: 'tag-2',
    name: 'viajes',
    description: 'Fotografías de viajes y aventuras',
    thumbnails: [
      'https://picsum.photos/200/300?random=64',
      'https://picsum.photos/200/300?random=65',
      'https://picsum.photos/200/300?random=66',
      'https://picsum.photos/200/300?random=67',
      'https://picsum.photos/200/300?random=68',
      'https://picsum.photos/200/300?random=69',
      'https://picsum.photos/200/300?random=70',
      'https://picsum.photos/200/300?random=71',
      'https://picsum.photos/200/300?random=72',
    ],
    count: 234,
    totalSize: '2.1 GB',
    color: '#EAFFD0'
  },
  {
    id: 'tag-3',
    name: 'mascotas',
    description: 'Fotografías de mascotas y animales',
    thumbnails: [
      'https://picsum.photos/200/300?random=73',
      'https://picsum.photos/200/300?random=74',
      'https://picsum.photos/200/300?random=75',
      'https://picsum.photos/200/300?random=76',
      'https://picsum.photos/200/300?random=77',
      'https://picsum.photos/200/300?random=78',
      'https://picsum.photos/200/300?random=79',
      'https://picsum.photos/200/300?random=80',
      'https://picsum.photos/200/300?random=81',
    ],
    count: 89,
    totalSize: '756 MB',
    color: '#FCE38A'
  }
]

export const sampleStats = {
  totalFiles: 1248,
  totalSize: '10.4 GB',
  totalCollections: 3,
  totalFolders: 3,
  totalTags: 3
}

// Datos de ejemplo para las vistas
export const sampleViewData = {
  collections: {
    'collection-1': generateSampleFiles(124, 'Vacaciones 2023'),
    'collection-2': generateSampleFiles(89, 'Fotografía Urbana'),
    'collection-3': generateSampleFiles(56, 'Retratos')
  },
  folders: {
    'folder-1': generateSampleFiles(245, 'Proyectos 2023'),
    'folder-2': generateSampleFiles(178, 'Eventos'),
    'folder-3': generateSampleFiles(312, 'Personal')
  },
  tags: {
    'naturaleza': generateSampleFiles(145, 'Naturaleza'),
    'viajes': generateSampleFiles(234, 'Viajes'),
    'mascotas': generateSampleFiles(89, 'Mascotas')
  }
}

function generateSampleFiles(count: number, prefix: string): FileItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix.toLowerCase()}-${i + 1}`,
    name: `${prefix} ${i + 1}.jpg`,
    extension: 'jpg',
    size: `${Math.floor(Math.random() * 10) + 1} MB`,
    type: Math.random() > 0.1 ? 'image' : 'folder',
    thumbnail: `https://picsum.photos/200/300?random=${Math.floor(Math.random() * 1000)}`,
    dateModified: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    dateCreated: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    dimensions: '1920x1080',
    children: []
  }))
}