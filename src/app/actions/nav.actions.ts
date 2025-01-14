'use server'

import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { getFolders } from './folder.actions'
import { getCollections } from './collection.actions'
import { getTags } from './tag.actions'
import { getAlbums } from './album.actions'
import { getCharacters } from './character.actions'
import { getPlaces } from './place.actions'
import { getObjects } from './object.actions'
import { getSystemStats } from './stats.actions'

const navLogger = logger.withContext('NavActions')

type SystemStats = {
  totalImages: number
  totalFolders: number
  totalCollections: number
  totalTags: number
  totalAlbums: number
  totalCharacters: number
  totalPlaces: number
  totalObjects: number
  totalFavorites: number
  totalActivities: number
  totalSize: number
  totalViews: number
  totalDownloads: number
  topTags: Array<{
    id: string
    name: string
    color: string
    count: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    createdAt: Date
    image: {
      id: string
      name: string
      thumbnail: Uint8Array | null
    } | null
  }>
}

const REVALIDATE_PATHS = [
  '/',
  '/settings',
  '/albums',
  '/collections',
  '/tags',
  '/folders',
  '/characters',
  '/places',
  '/objects'
] as const

export async function revalidateNavigation() {
  try {
    navLogger.info('🔄 Iniciando revalidación de rutas de navegación')

    await Promise.all(
      REVALIDATE_PATHS.map(async (path) => {
        revalidatePath(path)
      })
    )

    navLogger.info('✅ Rutas de navegación revalidadas exitosamente')
  } catch (error) {
    navLogger.error('❌ Error al revalidar rutas de navegación:', error)
    throw new Error('No se pudieron revalidar las rutas de navegación')
  }
}

export interface NavigationData {
  folders: Awaited<ReturnType<typeof getFolders>>
  collections: Awaited<ReturnType<typeof getCollections>>
  tags: Awaited<ReturnType<typeof getTags>>
  albums: Awaited<ReturnType<typeof getAlbums>>
  characters: Awaited<ReturnType<typeof getCharacters>>
  places: Awaited<ReturnType<typeof getPlaces>>
  objects: Awaited<ReturnType<typeof getObjects>>
  stats: SystemStats
}

export async function getNavigationData(): Promise<NavigationData> {
  try {
    navLogger.info('🧭 Obteniendo datos de navegación')

    const [
      folders,
      collections,
      tags,
      albums,
      characters,
      places,
      objects,
      stats
    ] = await Promise.allSettled([
      getFolders(),
      getCollections(),
      getTags(),
      getAlbums(),
      getCharacters(),
      getPlaces(),
      getObjects(),
      getSystemStats()
    ])

    navLogger.info('✅ Datos de navegación obtenidos exitosamente')

    const defaultStats: SystemStats = {
      totalImages: 0,
      totalFolders: 0,
      totalCollections: 0,
      totalTags: 0,
      totalAlbums: 0,
      totalCharacters: 0,
      totalPlaces: 0,
      totalObjects: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalFavorites: 0,
      totalActivities: 0,
      totalSize: 0,
      topTags: [],
      recentActivity: []
    }

    return {
      folders: folders.status === 'fulfilled' ? folders.value : [],
      collections: collections.status === 'fulfilled' ? collections.value : [],
      tags: tags.status === 'fulfilled' ? tags.value : [],
      albums: albums.status === 'fulfilled' ? albums.value : [],
      characters: characters.status === 'fulfilled' ? characters.value : [],
      places: places.status === 'fulfilled' ? places.value : [],
      objects: objects.status === 'fulfilled' ? objects.value : [],
      stats: stats.status === 'fulfilled' ? stats.value : defaultStats
    }
  } catch (error) {
    navLogger.error('❌ Error obteniendo datos de navegación:', error)
    throw new Error('No se pudieron obtener los datos de navegación')
  }
}