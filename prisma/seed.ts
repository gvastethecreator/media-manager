const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Crear carpeta Home
  const homeFolder = await prisma.folder.create({
    data: {
      name: 'Home',
      path: 'Home',
      isWatched: true
    }
  })

  console.log('📁 Carpeta Home creada:', homeFolder)

  // Crear algunas colecciones de prueba
  const collections = await prisma.collection.createMany({
    data: [
      {
        name: 'Favoritos',
        slug: 'favoritos',
        emoji: '⭐',
        color: '#fbbf24'
      },
      {
        name: 'Archivados',
        slug: 'archivados',
        emoji: '📦',
        color: '#94a3b8'
      },
      {
        name: 'Importantes',
        slug: 'importantes',
        emoji: '🎯',
        color: '#ef4444'
      }
    ]
  })

  console.log('📚 Colecciones creadas:', collections)

  // Crear algunas etiquetas de prueba
  const tags = await prisma.tag.createMany({
    data: [
      {
        name: 'Vacaciones',
        slug: 'vacaciones',
        color: '#22c55e'
      },
      {
        name: 'Trabajo',
        slug: 'trabajo',
        color: '#3b82f6'
      },
      {
        name: 'Familia',
        slug: 'familia',
        color: '#ec4899'
      }
    ]
  })

  console.log('🏷️ Etiquetas creadas:', tags)

  // Crear algunas imágenes de prueba
  const images = await prisma.image.createMany({
    data: [
      {
        name: 'test1.jpg',
        path: 'Home/test1.jpg',
        hash: 'hash1',
        size: 1024,
        mimeType: 'image/jpeg',
        folderId: homeFolder.id,
        metadata: JSON.stringify({
          width: 800,
          height: 600,
          description: 'Imagen de prueba 1'
        })
      },
      {
        name: 'test2.png',
        path: 'Home/test2.png',
        hash: 'hash2',
        size: 2048,
        mimeType: 'image/png',
        folderId: homeFolder.id,
        metadata: JSON.stringify({
          width: 1024,
          height: 768,
          description: 'Imagen de prueba 2'
        })
      }
    ]
  })

  console.log('🖼️ Imágenes creadas:', images)
  console.log('✅ Seed completado')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
