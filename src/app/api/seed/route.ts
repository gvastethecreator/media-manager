import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🌱 Iniciando seed desde API...')

    // Crear carpeta Home
    const homeFolder = await prisma.folder.create({
      data: {
        name: 'Home',
        path: 'Home',
        isWatched: true
      }
    })

    console.log('📁 Carpeta Home creada:', homeFolder)

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

    return NextResponse.json({
      success: true,
      data: {
        folder: homeFolder,
        images
      }
    })
  } catch (error) {
    console.error('❌ Error en seed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}