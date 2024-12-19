const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpiar la base de datos
  await prisma.imageStats.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.image.deleteMany()
  await prisma.folder.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.tag.deleteMany()

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
        emoji: '⭐',
        color: '#fbbf24',
        description: 'Mis imágenes favoritas',
        shortcut: 'Ctrl+F',
        sortBy: 'name',
        filters: '[]'
      },
      {
        name: 'Archivados',
        emoji: '📦',
        color: '#94a3b8',
        description: 'Imágenes archivadas',
        sortBy: 'name',
        filters: '[]'
      },
      {
        name: 'Importantes',
        emoji: '🎯',
        color: '#ef4444',
        description: 'Imágenes importantes',
        shortcut: 'Ctrl+I',
        sortBy: 'name',
        filters: '[]'
      }
    ]
  })

  console.log('📚 Colecciones creadas:', collections)

  // Crear algunas etiquetas de prueba
  const tags = await prisma.tag.createMany({
    data: [
      {
        name: 'Vacaciones',
        color: '#22c55e',
        description: 'Fotos de vacaciones',
        shortcut: 'Ctrl+V'
      },
      {
        name: 'Trabajo',
        color: '#3b82f6',
        description: 'Imágenes relacionadas con el trabajo',
        shortcut: 'Ctrl+T'
      },
      {
        name: 'Familia',
        color: '#ec4899',
        description: 'Fotos familiares',
        shortcut: 'Ctrl+L'
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

  // Obtener las colecciones y etiquetas creadas
  const [favoritosCollection] = await prisma.collection.findMany({
    where: { name: 'Favoritos' }
  })

  const [vacacionesTag, trabajoTag] = await prisma.tag.findMany({
    where: { name: { in: ['Vacaciones', 'Trabajo'] } }
  })

  // Obtener las imágenes creadas
  const [imagen1, imagen2] = await prisma.image.findMany({
    where: { name: { in: ['test1.jpg', 'test2.png'] } }
  })

  // Asociar imágenes con colecciones y etiquetas
  if (favoritosCollection && imagen1) {
    await prisma.collection.update({
      where: { id: favoritosCollection.id },
      data: {
        images: {
          connect: { id: imagen1.id }
        }
      }
    })
  }

  if (vacacionesTag && trabajoTag && imagen1 && imagen2) {
    await prisma.tag.update({
      where: { id: vacacionesTag.id },
      data: {
        images: {
          connect: { id: imagen1.id }
        }
      }
    })

    await prisma.tag.update({
      where: { id: trabajoTag.id },
      data: {
        images: {
          connect: { id: imagen2.id }
        }
      }
    })
  }

  // Crear estadísticas para las imágenes
  if (imagen1 && imagen2) {
    await prisma.imageStats.createMany({
      data: [
        {
          imageId: imagen1.id,
          views: 5,
          downloads: 2
        },
        {
          imageId: imagen2.id,
          views: 3,
          downloads: 1
        }
      ]
    })

    // Marcar una imagen como favorita
    await prisma.favorite.create({
      data: {
        imageId: imagen1.id
      }
    })
  }

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
