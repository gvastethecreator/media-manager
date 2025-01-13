import { NextRequest, NextResponse } from 'next/server'
import { getOriginalImage } from '@/app/actions/image.actions'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const headersList = headers()
    const { id } = context.params

    const { buffer, mimeType } = await getOriginalImage(id)

    // Configurar headers de caché
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    })

    return response
  } catch (error) {
    console.error('Error serving original image:', error)
    return new NextResponse('Error al servir la imagen original', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'