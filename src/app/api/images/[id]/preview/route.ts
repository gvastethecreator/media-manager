import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de imagen no proporcionado' },
        { status: 400 }
      )
    }

    // Buscar la imagen en la base de datos
    const image = await prisma.image.findUnique({
      where: { id }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // Construir la ruta al archivo
    const filePath = image.path

    try {
      // Verificar que el archivo existe
      const stats = await stat(filePath)
      
      // Crear un stream de lectura del archivo
      const stream = createReadStream(filePath)

      // Determinar el tipo MIME
      const mimeType = image.mimeType || 'application/octet-stream'

      // Crear y retornar la respuesta con el stream
      return new NextResponse(stream as any, {
        headers: {
          'Content-Type': mimeType,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000',
          'Accept-Ranges': 'bytes'
        }
      })
    } catch (error) {
      console.error('Error al leer el archivo:', error)
      return NextResponse.json(
        { error: 'Error al leer el archivo' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en GET /api/images/[id]/preview:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
