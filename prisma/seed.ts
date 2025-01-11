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
        name: 'COMFY',
        path: 'G:\\#OUTPUTS\\COMFY\\2025-01-01',
        totalFiles: 0,
        totalSize: 0,
      },
      {
        name: 'Upscales',
        path: 'G:\\#OUTPUTS\\Upscales',
        totalFiles: 0,
        totalSize: 0,
      },
      {
        name: 'Exports',
        path: 'G:\\#OUTPUTS\\Exports',
        totalFiles: 0,
        totalSize: 0,
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
        name: 'Espada del Crepúsculo',
        emoji: '⚔️',
        color: '#8b5cf6',
        description: 'Una espada legendaria forjada con metales celestiales',
        shortcut: 'esp',
        type: 'weapon',
        rarity: 'legendary',
        properties: JSON.stringify([
          'Daño celestial',
          'Absorción de luz',
          'Invocación de espíritus'
        ]),
        requirements: JSON.stringify({
          level: 10,
          class: ['Paladin', 'Fighter'],
          alignment: 'good'
        }),
        origin: 'Forjada por los herreros celestiales en la Era del Amanecer'
      },
      {
        name: 'Grimorio de los Secretos Perdidos',
        emoji: '📖',
        color: '#10b981',
        description: 'Un antiguo libro de hechizos y conocimientos prohibidos',
        shortcut: 'gri',
        type: 'spellbook',
        rarity: 'artifact',
        properties: JSON.stringify([
          'Amplificación mágica',
          'Almacenamiento de hechizos',
          'Sabiduría ancestral'
        ]),
        requirements: JSON.stringify({
          level: 15,
          class: ['Wizard', 'Warlock'],
          intelligence: 16
        }),
        origin: 'Escrito por el Archimago Morius en la biblioteca de Aethoria'
      },
      {
        name: 'Cristal del Tiempo Infinito',
        emoji: '💎',
        color: '#3b82f6',
        description: 'Una reliquia que permite manipular el flujo del tiempo',
        shortcut: 'cri',
        type: 'artifact',
        rarity: 'unique',
        properties: JSON.stringify([
          'Control temporal',
          'Visiones del futuro',
          'Almacenamiento de momentos'
        ]),
        requirements: JSON.stringify({
          level: 20,
          class: ['Chronomancer'],
          wisdom: 18
        }),
        origin: 'Creado por Chronos en la Forja del Tiempo'
      },
    ],
  })

  // Crear lugares por defecto
  seedLogger.info('🗺️ Creando lugares por defecto...')
  const defaultPlaces = await prisma.place.createMany({
    data: [
      {
        name: 'Bosque Encantado de Silverleaf',
        emoji: '🌳',
        color: '#10b981',
        description: 'Un bosque mágico lleno de criaturas místicas',
        shortcut: 'bos',
        region: 'Tierras del Norte',
        climate: 'temperate',
        population: 500,
        dangers: JSON.stringify([
          'Hadas traviesas',
          'Árboles ancestrales conscientes',
          'Portales dimensionales inestables'
        ]),
        resources: JSON.stringify([
          'Hierbas mágicas',
          'Cristales de luna',
          'Madera encantada'
        ]),
        lore: 'El Bosque Encantado de Silverleaf ha sido el hogar de las criaturas mágicas desde el inicio de los tiempos. Sus árboles plateados brillan bajo la luz de la luna, y se dice que el bosque mismo está vivo y consciente.'
      },
      {
        name: 'Ciudad Flotante de Aethoria',
        emoji: '🏰',
        color: '#8b5cf6',
        description: 'Una ciudad que flota entre las nubes',
        shortcut: 'ciu',
        region: 'Cielos del Este',
        climate: 'temperate',
        population: 10000,
        dangers: JSON.stringify([
          'Tormentas de éter',
          'Piratas del cielo',
          'Fallos en los cristales de levitación'
        ]),
        resources: JSON.stringify([
          'Cristales de levitación',
          'Éter refinado',
          'Tecnología antigua'
        ]),
        lore: 'Aethoria fue construida hace milenios usando tecnología perdida. Sus habitantes han desarrollado una sociedad avanzada basada en la magia del éter y la tecnología antigua.'
      },
      {
        name: 'Cavernas de Cristal Eterno',
        emoji: '💎',
        color: '#3b82f6',
        description: 'Cavernas iluminadas por cristales mágicos',
        shortcut: 'cav',
        region: 'Montañas del Oeste',
        climate: 'subterranean',
        population: 1000,
        dangers: JSON.stringify([
          'Golems de cristal',
          'Resonancias cristalinas',
          'Derrumbes mágicos'
        ]),
        resources: JSON.stringify([
          'Cristales mágicos',
          'Minerales raros',
          'Agua de cristal'
        ]),
        lore: 'Las Cavernas de Cristal Eterno fueron descubiertas por antiguos enanos que buscaban minerales raros. Los cristales que iluminan las cavernas tienen propiedades mágicas únicas y son codiciados por magos de todo el mundo.'
      },
    ],
  })

  // Crear personajes por defecto
  seedLogger.info('👥 Creando personajes por defecto...')
  const defaultCharacters = await prisma.character.createMany({
    data: [
      {
        name: 'Luna Silverweave',
        emoji: '🌙',
        color: '#8b5cf6',
        description: 'Guardiana de los sueños y protectora de la noche',
        shortcut: 'lun',
        level: 15,
        class: 'Mage',
        race: 'High Elf',
        alignment: 'Lawful Good',
        backstory: 'Nacida bajo la luna llena en el Bosque Plateado, Luna fue elegida desde su nacimiento para ser la guardiana de los sueños. Su conexión con la magia lunar le otorga poderes únicos sobre los sueños y las sombras.',
        stats: JSON.stringify({
          strength: 8,
          dexterity: 14,
          constitution: 10,
          intelligence: 18,
          wisdom: 16,
          charisma: 14
        })
      },
      {
        name: 'Chronos Timebender',
        emoji: '⌛',
        color: '#3b82f6',
        description: 'Maestro del tiempo y guardián de las eras',
        shortcut: 'chr',
        level: 20,
        class: 'Chronomancer',
        race: 'Eternal',
        alignment: 'True Neutral',
        backstory: 'Un ser enigmático que existe fuera del tiempo normal. Chronos vigila las líneas temporales y mantiene el equilibrio entre pasado, presente y futuro.',
        stats: JSON.stringify({
          strength: 10,
          dexterity: 12,
          constitution: 14,
          intelligence: 20,
          wisdom: 18,
          charisma: 16
        })
      },
      {
        name: 'Shadow Nightwhisper',
        emoji: '👤',
        color: '#1f2937',
        description: 'Enigmático vigilante de las sombras',
        shortcut: 'sha',
        level: 12,
        class: 'Rogue',
        race: 'Shadowborn',
        alignment: 'Chaotic Neutral',
        backstory: 'Criado en las profundidades de la Ciudad Sombría, Shadow desarrolló una afinidad natural con las sombras y el sigilo. Ahora usa sus habilidades para mantener el equilibrio entre luz y oscuridad.',
        stats: JSON.stringify({
          strength: 12,
          dexterity: 18,
          constitution: 12,
          intelligence: 14,
          wisdom: 12,
          charisma: 16
        })
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
