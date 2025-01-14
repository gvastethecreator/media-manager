import { NextRequest, NextResponse } from 'next/server'
import { verifySignedToken } from '@/app/actions/image.actions'

export async function GET(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params

    // Verificar token y obtener imagen
    const { buffer, mimeType } = await verifySignedToken(token)

    // Configurar headers de caché
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'Content-Length': buffer.length.toString(),
      },
    })

    return response
  } catch (error) {
    console.error('Error serving signed image:', error)
    return new NextResponse('Error al servir la imagen', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'