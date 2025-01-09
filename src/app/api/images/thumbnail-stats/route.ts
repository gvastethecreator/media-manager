import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener el total de imágenes y miniaturas
    const [totalImages, totalThumbnails] = await Promise.all([
      prisma.image.count(),
      prisma.image.count({
        where: {
          thumbnail: {
            not: null
          }
        }
      })
    ])

    // Calcular el tamaño total de las miniaturas
    const thumbnailSizeResult = await prisma.image.aggregate({
      _sum: {
        thumbnailSize: true
      },
      where: {
        thumbnail: {
          not: null
        }
      }
    })

    const totalSize = thumbnailSizeResult._sum.thumbnailSize || 0

    // Obtener imágenes con errores en sus miniaturas
    const errorsResult = await prisma.image.findMany({
      where: {
        thumbnailError: {
          not: null
        }
      },
      select: {
        id: true,
        path: true,
        thumbnailError: true,
        thumbnailErrorAt: true
      }
    })

    const errors = errorsResult.map((img: any) => ({
      imageId: img.id,
      imagePath: img.path,
      error: img.thumbnailError!,
      timestamp: img.thumbnailErrorAt!
    }))

    // Calcular miniaturas pendientes
    const pending = totalImages - totalThumbnails

    return NextResponse.json({
      total: totalImages,
      totalSize,
      pending,
      errors
    })
  } catch (error) {
    console.error('Error getting thumbnail stats:', error)
    return NextResponse.json(
      { error: 'Error getting thumbnail stats' },
      { status: 500 }
    )
  }
}
