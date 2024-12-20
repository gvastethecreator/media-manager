import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect()

    // Obtener estadísticas de miniaturas
    const imagesWithoutThumbnails = await prisma.image.count({
      where: { thumbnail: null }
    })

    // Obtener estadísticas del sistema
    const stats = {
      database: {
        status: 'connected',
        message: 'Base de datos conectada'
      },
      thumbnails: {
        status: 'active',
        pending: imagesWithoutThumbnails,
        message: imagesWithoutThumbnails > 0
          ? `${imagesWithoutThumbnails} miniaturas pendientes`
          : 'Servicio de miniaturas listo'
      },
      settings: {
        status: 'active',
        message: 'Configuraciones cargadas'
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al obtener estado del sistema:', error)
    return NextResponse.json(
      { error: 'Error al obtener estado del sistema' },
      { status: 500 }
    )
  }
}