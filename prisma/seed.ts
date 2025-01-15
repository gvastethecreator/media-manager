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
      color: '#AE3F94FF',
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
        name: '2024-12-17',
        path: 'G:\\#OUTPUTS\\COMFY\\2024-12-17',
        totalFiles: 0,
        totalSize: 0,
      },
      {
        name: '2024-08-29',
        path: 'G:\\#OUTPUTS\\SDMatrix\\2024-08-29',
        totalFiles: 0,
        totalSize: 0,
      },
      {
        name: 'retro',
        path: 'D:\\Pictures\\retro',
        totalFiles: 0,
        totalSize: 0,
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
      {
        name: 'Pruebas',
        emoji: '🧪',
        color: '#eab308',
        description: 'Pruebas y experimentos',
        shortcut: 'pr',
      },
      {
        name: 'Pixel Art',
        emoji: '🎨',
        color: '#8b5cf6',
        description: 'Pixel Art',
        shortcut: 'pa',
      },
      {
        name: 'Upscales',
        emoji: '✨',
        color: '#10b981',
        description: 'Upscales',
        shortcut: 'up',
      },
    ],
  })


  // Crear colecciones por defecto
  seedLogger.info('📚 Creando colecciones por defecto...')
  const defaultCollections = await prisma.collection.createMany({
    data: [
      {
        name: 'Pepe Archives',
        emoji: '🐸',
        color: '#8b5cf6',
        description: 'Archivos de Pepe',
        shortcut: 'pepe',
      },
      {
        name: 'Life after Moklos',
        emoji: '🏠',
        color: '#10b981',
        description: 'Vida después de Moklos',
        shortcut: 'lalm',
      },
      {
        name: 'Moklos',
        emoji: '🏠',
        color: '#C63AC4FF',
        description: 'Vida antes de Moklos',
        shortcut: 'mok',
      },
      {
        name: 'Retro',
        emoji: '🎥',
        color: '#B9A847FF',
        description: 'Retro',
        shortcut: 'ret',
      },
      {
        name: 'Bootlegs',
        emoji: '🎥',
        color: '#3AC651FF',
        description: 'Bootlegs',
        shortcut: 'bl',
      },
      {
        name: '3D',
        emoji: '🎥',
        color: '#35556EFF',
        description: '3D',
        shortcut: '3d',
      },
    ],
  })

  // Crear etiquetas por defecto
  seedLogger.info('🏷️ Creando etiquetas por defecto...')
  const defaultTags = await prisma.tag.createMany({
    data: [
      {
        name: 'Cute',
        color: '#eab308',
      },
      {
        name: 'Character Design',
        color: '#ef4444',
      },
      {
        name: 'Concept Art',
        color: '#f59e0b',
      },
      {
        name: 'Hardcore',
        color: '#10b981',
      },
      {
        name: 'Pixel Art',
        color: '#8b5cf6',
      },
      {
        name: '3D',
        color: '#35556EFF',
      },
      {
        name: 'Comfy',
        color: '#3AC651FF',
      },
      {
        name: 'Tests',
        color: '#C63AC6FF',
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
      {
        name: 'Anillo de la Serpiente Plateada',
        emoji: '💍',
        color: '#3b82f6',
        description: 'Un anillo que aumenta la probabilidad de obtener objetos raros',
        shortcut: 'anr',
        type: 'ring',
        rarity: 'rare',
        properties: JSON.stringify([
          'Aumenta la probabilidad de obtener objetos raros'
        ]),
        requirements: JSON.stringify({
          level: 5,
          class: ['Thief', 'Assassin'],
          dexterity: 15
        }),
        origin: 'Obtenido de la Serpiente Plateada en el Bosque Real'
      },
      {
        name: 'Escudo de Hierro Negro',
        emoji: '🛡️',
        color: '#8b5cf6',
        description: 'Un escudo pesado forjado con hierro negro',
        shortcut: 'esc',
        type: 'shield',
        rarity: 'rare',
        properties: JSON.stringify([
          'Alta resistencia',
          'Peso pesado',
          'Reducción de daño'
        ]),
        requirements: JSON.stringify({
          level: 10,
          class: ['Knight', 'Warrior'],
          strength: 20
        }),
        origin: 'Forjado por los herreros de Anor Londo'
      },
      {
        name: 'Llave de la Puerta de la Muerte',
        emoji: '🔑',
        color: '#8b5cf6',
        description: 'Una llave que abre la puerta a la muerte',
        shortcut: 'llm',
        type: 'key',
        rarity: 'rare',
        properties: JSON.stringify([
          'Abre la puerta a la muerte'
        ]),
        requirements: JSON.stringify({
          level: 15,
          class: ['Warlock', 'Necromancer'],
          intelligence: 18
        }),
        origin: 'Obtenida de la tumba del Rey de la Muerte'
      },
      {
        name: 'Cetro de la Reina de la Oscuridad',
        emoji: '⚡️',
        color: '#3b82f6',
        description: 'Un cetro que controla la oscuridad',
        shortcut: 'cro',
        type: 'staff',
        rarity: 'rare',
        properties: JSON.stringify([
          'Controla la oscuridad',
          'Aumenta la velocidad de movimiento'
        ]),
        requirements: JSON.stringify({
          level: 20,
          class: ['Sorcerer', 'Warlock'],
          intelligence: 20
        }),
        origin: 'Obtenido de la Reina de la Oscuridad en el Reino de la Oscuridad'
      },
      {
        name: 'Armadura de la Bestia',
        emoji: '🦖',
        color: '#8b5cf6',
        description: 'Una armadura que aumenta la fuerza y la resistencia',
        shortcut: 'arm',
        type: 'armor',
        rarity: 'rare',
        properties: JSON.stringify([
          'Aumenta la fuerza',
          'Aumenta la resistencia'
        ]),
        requirements: JSON.stringify({
          level: 15,
          class: ['Warrior', 'Knight'],
          strength: 25
        }),
        origin: 'Forjada por los herreros de la Bestia en la Montaña de la Bestia'
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
  // Crear personajes por defecto, incluyendo nuevos personajes inspirados en personajes famosos y conocidos, inspirados en Dark Souls, Dragon Ball o Final Fantasy, y algunos con nombres como Roberto, Pancho, Pichula
  seedLogger.info('👥 Creando personajes por defecto, incluyendo nuevos personajes inspirados en personajes famosos y conocidos, inspirados en Dark Souls, Dragon Ball o Final Fantasy, y algunos con nombres como Roberto, Pancho, Pichula...')
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
      {
        name: 'Goku Starlight',
        emoji: '🌟',
        color: '#f2a365',
        description: 'Guerrero de la luz y defensor del universo',
        shortcut: 'gok',
        level: 25,
        class: 'Warrior',
        race: 'Saiyan',
        alignment: 'Lawful Good',
        backstory: 'Originario del planeta Vegeta, Gokú es un guerrero legendario que ha defendido el universo de innumerables amenazas. Su poder y determinación son inspiración para muchos.',
        stats: JSON.stringify({
          strength: 20,
          dexterity: 16,
          constitution: 18,
          intelligence: 12,
          wisdom: 14,
          charisma: 18
        })
      },
      {
        name: 'Cloud Strife',
        emoji: '⚔️',
        color: '#3b82f6',
        description: 'Líder de la resistencia y vengador del planeta',
        shortcut: 'clo',
        level: 22,
        class: 'Warrior',
        race: 'Human',
        alignment: 'Neutral Good',
        backstory: 'Exmiembro de SOLDADO, Cloud se unió a la resistencia para luchar contra la megacorporación Shinra y proteger el planeta de la destrucción.',
        stats: JSON.stringify({
          strength: 18,
          dexterity: 14,
          constitution: 16,
          intelligence: 10,
          wisdom: 12,
          charisma: 16
        })
      },
      {
        name: 'Solaire of Astora',
        emoji: '☀️',
        color: '#f2a365',
        description: 'Caballero solar y defensor de la humanidad',
        shortcut: 'sol',
        level: 18,
        class: 'Knight',
        race: 'Human',
        alignment: 'Lawful Good',
        backstory: 'Un caballero de la orden de Astora, Solaire es conocido por su optimismo y su determinación de proteger a la humanidad de las fuerzas oscuras.',
        stats: JSON.stringify({
          strength: 16,
          dexterity: 12,
          constitution: 14,
          intelligence: 10,
          wisdom: 14,
          charisma: 18
        })
      },
      {
        name: 'Roberto the Brave',
        emoji: '🛡️',
        color: '#8b5cf6',
        description: 'Valiente guerrero y protector de los débiles',
        shortcut: 'rob',
        level: 15,
        class: 'Warrior',
        race: 'Human',
        alignment: 'Lawful Good',
        backstory: 'Un valiente guerrero que ha jurado proteger a los débiles y luchar por la justicia. Su coraje y determinación son admirados por todos.',
        stats: JSON.stringify({
          strength: 18,
          dexterity: 14,
          constitution: 16,
          intelligence: 10,
          wisdom: 12,
          charisma: 16
        })
      },
      {
        name: 'Pancho the Jester',
        emoji: '🤡',
        color: '#f2a365',
        description: 'Bromista y entretenedor de la corte',
        shortcut: 'pan',
        level: 10,
        class: 'Bard',
        race: 'Human',
        alignment: 'Chaotic Neutral',
        backstory: 'Un bromista y entretenedor que viaja de ciudad en ciudad, llevando alegría a la gente. Su ingenio y habilidades musicales son legendarios.',
        stats: JSON.stringify({
          strength: 10,
          dexterity: 14,
          constitution: 12,
          intelligence: 14,
          wisdom: 12,
          charisma: 18
        })
      },
      {
        name: 'Pichula the Mysterious',
        emoji: '🎭',
        color: '#3b82f6',
        description: 'Misterioso mago y coleccionista de secretos',
        shortcut: 'pic',
        level: 20,
        class: 'Wizard',
        race: 'Elf',
        alignment: 'Neutral Evil',
        backstory: 'Un mago misterioso que vive en las profundidades de un bosque encantado. Se dice que ha acumulado un vasto conocimiento de secretos oscuros y poderes prohibidos.',
        stats: JSON.stringify({
          strength: 10,
          dexterity: 12,
          constitution: 14,
          intelligence: 20,
          wisdom: 18,
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
