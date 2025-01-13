import { NextRequest, NextResponse } from 'next/server'
import { getOriginalImage } from '@/app/actions/images'
import { createHash } from 'crypto'

// Función para validar hash
function validateHash(id: string, timestamp: string, hash: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET || 'your-secret-key'
  const expectedHash = createHash('sha256')
    .update(`${id}:${timestamp}:${secret}`)
    .digest('hex')
    .slice(0, 32)

  return hash === expectedHash
}

// Función para validar timestamp (1 hora de validez)
function validateTimestamp(timestamp: string): boolean {
  const timestampNum = parseInt(timestamp, 10)
  const now = Date.now()
  const diff = now - timestampNum
  return diff >= 0 && diff < 3600000 // 1 hora en milisegundos
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string; timestamp: string; hash: string } }
) {
  try {
    const { id, timestamp, hash } = context.params

    // Validar hash y timestamp
    if (!validateHash(id, timestamp, hash)) {
      return new NextResponse('Hash inválido', { status: 401 })
    }

    if (!validateTimestamp(timestamp)) {
      return new NextResponse('URL expirada', { status: 401 })
    }

    // Obtener imagen
    const { buffer, mimeType } = await getOriginalImage(id)

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
    console.error('Error serving temporary image:', error)
    return new NextResponse('Error al servir la imagen', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'