import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getOriginalImage } from '@/app/actions/image.actions'

export async function GET(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params

    // Verificar token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')
    )

    if (!payload.imageId || typeof payload.imageId !== 'string') {
      return new NextResponse('Token inválido', { status: 401 })
    }

    // Obtener imagen
    const { buffer, mimeType } = await getOriginalImage(payload.imageId)

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