import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  try {
    // Limpiar la base de datos
    console.log('🧹 Limpiando base de datos...')
    await Promise.all([
      prisma.imageStats.deleteMany(),
      prisma.favorite.deleteMany(),
      prisma.image.deleteMany(),
      prisma.folder.deleteMany(),
      prisma.collection.deleteMany(),
      prisma.tag.deleteMany(),
      prisma.profile.deleteMany(),
    ])

    // Crear perfil por defecto
    console.log('👤 Creando perfil por defecto...')
    const defaultProfile = await prisma.profile.create({
      data: {
        name: 'Usuario Principal',
        emoji: '👤',
        color: '#3b82f6',
        theme: 'system',
        language: 'es',
        isActive: true
      }
    })

    console.log('✅ Perfil creado:', defaultProfile.name)

    // Crear carpetas iniciales
    console.log('📁 Creando carpetas...')
    const folders = await prisma.folder.createMany({
      data: [
        {
          name: 'Cartoons',
          path: 'D:\\Pictures\\Cartoons',
          isWatched: true
        },
        {
          name: 'Retro',
          path: 'D:\\Pictures\\retro',
          isWatched: true
        },
        {
          name: 'Comfy 2024-12-15',
          path: 'G:\\#OUTPUTS\\COMFY\\2024-12-15',
          isWatched: true
        },
        {
          name: 'Comfy 2025-01-01',
          path: 'G:\\#OUTPUTS\\COMFY\\2025-01-01',
          isWatched: true
        }
      ]
    })

    console.log('✅ Carpetas creadas:', folders.count)

    // Crear colecciones
    console.log('📚 Creando colecciones...')
    const collections = await prisma.collection.createMany({
      data: [
        {
          name: 'personajes',
          emoji: '👥',
          color: '#FF6B6B',
          description: 'Colección de personajes y diseños de personajes',
          sortBy: 'name',
          filters: '[]'
        },
        {
          name: 'paisajes',
          emoji: '🌄',
          color: '#4ECDC4',
          description: 'Paisajes y escenarios',
          sortBy: 'name',
          filters: '[]'
        },
        {
          name: 'criaturas',
          emoji: '🐉',
          color: '#45B7D1',
          description: 'Criaturas fantásticas y diseños de criaturas',
          sortBy: 'name',
          filters: '[]'
        },
        {
          name: 'moklos',
          emoji: '🎭',
          color: '#96CEB4',
          description: 'Colección Moklos',
          sortBy: 'name',
          filters: '[]'
        },
        {
          name: 'hot',
          emoji: '🔥',
          color: '#FF4858',
          description: 'Contenido hot',
          sortBy: 'name',
          filters: '[]'
        }
      ]
    })

    console.log('✅ Colecciones creadas:', collections.count)

    // Crear etiquetas
    console.log('🏷️ Creando etiquetas...')
    const tags = await prisma.tag.createMany({
      data: [
        {
          name: 'character design',
          color: '#FF9F1C',
          description: 'Diseños de personajes',
        },
        {
          name: 'concept art',
          color: '#2EC4B6',
          description: 'Arte conceptual',
        },
        {
          name: 'memes',
          color: '#E71D36',
          description: 'Memes y contenido humorístico',
        },
        {
          name: 'fuego',
          color: '#FF6B6B',
          description: 'Elementos y temas relacionados con fuego',
        },
        {
          name: 'agua',
          color: '#4ECDC4',
          description: 'Elementos y temas relacionados con agua',
        },
        {
          name: 'hielo',
          color: '#A8E6CF',
          description: 'Elementos y temas relacionados con hielo',
        },
        {
          name: 'oscuro',
          color: '#2D3436',
          description: 'Temas oscuros y sombríos',
        }
      ]
    })

    console.log('✅ Etiquetas creadas:', tags.count)
    console.log('✨ Seed completado exitosamente')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    console.log('🔄 Cerrando conexión...')
    await prisma.$disconnect()
  })
