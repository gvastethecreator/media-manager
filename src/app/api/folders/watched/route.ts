import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/folders/watched
 * Obtiene todas las carpetas que están siendo observadas
 */
export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      where: { isWatched: true },
      select: {
        id: true,
        path: true,
        isWatched: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      folders
    })
  } catch (error) {
    console.error('❌ [API] Error al obtener carpetas observadas:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener carpetas observadas'
      },
      { status: 500 }
    )
  }
}