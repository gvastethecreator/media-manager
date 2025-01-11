import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'

const prisma = new PrismaClient()
const seedLogger = logger.withContext('Seed')

async function main() {
  seedLogger.info('🌱 Iniciando proceso de seed...')

  // Limpiar la base de datos
  seedLogger.info('🧹 Limpiando base de datos...')
  await prisma.profile.deleteMany()
  await prisma.folder.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.album.deleteMany()
  await prisma.object.deleteMany()
  await prisma.place.deleteMany()
  await prisma.character.deleteMany()

  // Crear perfil por defecto
  seedLogger.info('👤 Creando perfil por defecto...')
  const defaultProfile = await prisma.profile.create({
    data: {
      name: 'Default',
      emoji: '👤',
      color: '#3b82f6',
      description: 'Perfil por defecto',
    },
  })

  // Crear carpetas por defecto
  seedLogger.info('📁 Creando carpetas por defecto...')
  const defaultFolders = await prisma.folder.createMany({
    data: [
      {
        name: 'Favoritos',
        path: 'D:\\Pictures\\Favorites',
        isWatched: true,
      },
      {
        name: 'Archivados',
        path: 'D:\\Pictures\\Archived',
        isWatched: true,
      },
      {
        name: 'Papelera',
        path: 'D:\\Pictures\\Trash',
        isWatched: true,
      },
    ],
  })

  // Crear colecciones por defecto
  seedLogger.info('📚 Creando colecciones por defecto...')
  const defaultCollections = await prisma.collection.createMany({
    data: [
      {
        name: 'Wallpapers',
        emoji: '🖼️',
        color: '#8b5cf6',
        description: 'Fondos de pantalla',
        shortcut: 'w',
      },
      {
        name: 'Screenshots',
        emoji: '📸',
        color: '#10b981',
        description: 'Capturas de pantalla',
        shortcut: 's',
      },
      {
        name: 'Memes',
        emoji: '😂',
        color: '#f59e0b',
        description: 'Memes y humor',
        shortcut: 'm',
      },
    ],
  })

  // Crear etiquetas por defecto
  seedLogger.info('🏷️ Creando etiquetas por defecto...')
  const defaultTags = await prisma.tag.createMany({
    data: [
      {
        name: 'Favorito',
        color: '#eab308',
      },
      {
        name: 'Importante',
        color: '#ef4444',
      },
      {
        name: 'Pendiente',
        color: '#f59e0b',
      },
      {
        name: 'Completado',
        color: '#10b981',
      },
    ],
  })

  // Crear álbumes por defecto
  seedLogger.info('📔 Creando álbumes por defecto...')
  const defaultAlbums = await prisma.album.createMany({
    data: [
      {
        name: 'Favoritos 2024',
        emoji: '⭐',
        color: '#eab308',
        description: 'Imágenes favoritas del 2024',
        shortcut: 'f24',
      },
      {
        name: 'Referencias',
        emoji: '📚',
        color: '#8b5cf6',
        description: 'Referencias e inspiración',
        shortcut: 'ref',
      },
      {
        name: 'Inspiración',
        emoji: '💡',
        color: '#10b981',
        description: 'Ideas y conceptos',
        shortcut: 'ins',
      },
    ],
  })

  // Crear objetos por defecto
  seedLogger.info('🎭 Creando objetos por defecto...')
  const defaultObjects = await prisma.object.createMany({
    data: [
      {
        name: 'Espada legendaria',
        emoji: '⚔️',
        color: '#8b5cf6',
        description: 'Una espada mágica con poderes ancestrales',
        shortcut: 'esp',
      },
      {
        name: 'Grimorio',
        emoji: '📖',
        color: '#10b981',
        description: 'Libro antiguo de hechizos y conjuros',
        shortcut: 'gri',
      },
      {
        name: 'Cristal del tiempo',
        emoji: '💎',
        color: '#3b82f6',
        description: 'Reliquia que permite controlar el tiempo',
        shortcut: 'cri',
      },
    ],
  })

  // Crear lugares por defecto
  seedLogger.info('🗺️ Creando lugares por defecto...')
  const defaultPlaces = await prisma.place.createMany({
    data: [
      {
        name: 'Bosque encantado',
        emoji: '🌳',
        color: '#10b981',
        description: 'Un bosque mágico lleno de criaturas místicas',
        shortcut: 'bos',
      },
      {
        name: 'Ciudad flotante',
        emoji: '🏰',
        color: '#8b5cf6',
        description: 'Una ciudad que flota entre las nubes',
        shortcut: 'ciu',
      },
      {
        name: 'Cavernas de cristal',
        emoji: '💎',
        color: '#3b82f6',
        description: 'Cavernas iluminadas por cristales mágicos',
        shortcut: 'cav',
      },
    ],
  })

  // Crear personajes por defecto
  seedLogger.info('👥 Creando personajes por defecto...')
  const defaultCharacters = await prisma.character.createMany({
    data: [
      {
        name: 'Luna',
        emoji: '🌙',
        color: '#8b5cf6',
        description: 'Guardiana de los sueños y protectora de la noche',
        shortcut: 'lun',
      },
      {
        name: 'Chronos',
        emoji: '⌛',
        color: '#3b82f6',
        description: 'Maestro del tiempo y guardián de las eras',
        shortcut: 'chr',
      },
      {
        name: 'Shadow',
        emoji: '👤',
        color: '#1f2937',
        description: 'Enigmático vigilante de las sombras',
        shortcut: 'sha',
      },
    ],
  })

  seedLogger.info('✅ Proceso de seed completado')
}

main()
  .catch((e) => {
    seedLogger.error('❌ Error durante el proceso de seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
