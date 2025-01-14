import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const headersList = headers()
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Reconstruir la ruta del archivo
    let filePath = params.path.join('/')

    // Manejar unidades de disco de Windows
    if (filePath.startsWith('g/') || filePath.startsWith('G/')) {
      filePath = `G:${filePath.substring(1)}`
    } else if (filePath.startsWith('d/') || filePath.startsWith('D/')) {
      filePath = `D:${filePath.substring(1)}`
    } else if (filePath.startsWith('c/') || filePath.startsWith('C/')) {
      filePath = `C:${filePath.substring(1)}`
    }

    // Convertir separadores de URL a separadores del sistema
    const fullPath = filePath.split('/').join(path.sep)

    // Validar que el archivo existe
    if (!existsSync(fullPath)) {
      console.error('Archivo no encontrado:', { filePath, fullPath })
      return new NextResponse('Archivo no encontrado', { status: 404 })
    }

    // Leer el archivo
    const buffer = await fs.readFile(fullPath)

    // Determinar el tipo MIME basado en la extensión
    const ext = path.extname(fullPath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp'
    }
    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    // Registrar acceso al archivo
    console.info('Archivo servido:', {
      path: filePath,
      fullPath,
      size: buffer.length,
      mimeType,
      userAgent
    })

    // Devolver el archivo con el tipo MIME correcto
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error sirviendo archivo:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}