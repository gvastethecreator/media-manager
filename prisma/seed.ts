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

  try {
    // Desactivar todos los perfiles existentes
    await prisma.profile.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })
  } catch (error) {
    console.log('No hay perfiles que desactivar')
  }

  // Crear perfil por defecto
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

  console.log('👤 Perfil por defecto creado:', defaultProfile)

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
        name: 'Familia',
        color: '#22c55e',
        description: 'Fotos familiares',
        shortcut: 'Ctrl+1'
      },
      {
        name: 'Trabajo',
        color: '#3b82f6',
        description: 'Imágenes relacionadas con el trabajo',
        shortcut: 'Ctrl+2'
      },
      {
        name: 'Vacaciones',
        color: '#f59e0b',
        description: 'Fotos de vacaciones',
        shortcut: 'Ctrl+3'
      }
    ]
  })

  console.log('🏷️ Etiquetas creadas:', tags)

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
