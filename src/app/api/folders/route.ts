import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fsService } from '@/services/fs.server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { path: folderPath } = data

    console.log('Agregando carpeta:', folderPath)

    // Validar la ruta
    const validation = await fsService.validatePath(folderPath)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Normalizar la ruta
    const normalizedPath = fsService.normalizePath(folderPath)

    // Verificar si la carpeta ya existe
    const existingFolder = await prisma.folder.findFirst({
      where: {
        OR: [
          { path: normalizedPath },
          { path: { endsWith: normalizedPath } },
          { path: { startsWith: normalizedPath } }
        ]
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: `La carpeta "${normalizedPath}" o una carpeta que la contiene ya está indexada` },
        { status: 400 }
      )
    }

    // Crear la carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        path: normalizedPath,
        name: normalizedPath.split('\\').pop() || normalizedPath,
        isWatched: true
      }
    })

    console.log('Carpeta creada:', folder)

    // Iniciar la indexación de archivos
    const files = await fsService.listFiles(normalizedPath)
    console.log('Archivos encontrados:', files.length)

    let totalSize = 0
    let totalFiles = 0

    for (const file of files) {
      if (await fsService.isImage(file.path)) {
        try {
          const hash = await fsService.calculateFileHash(file.path)
          const metadata = await fsService.getFileMetadata(file.path)

          await prisma.image.create({
            data: {
              name: file.name,
              path: file.path,
              hash,
              size: file.size,
              mimeType: `image/${path.extname(file.path).slice(1)}`,
              metadata: JSON.stringify(metadata),
              folderId: folder.id,
              isPublic: false
            }
          })

          totalSize += file.size
          totalFiles++
          console.log('Imagen indexada:', file.name)
        } catch (error) {
          console.error('Error indexando imagen:', file.path, error)
          // Continuar con el siguiente archivo
        }
      }
    }

    // Actualizar estadísticas de la carpeta
    await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles,
        totalSize,
        lastIndexed: new Date()
      }
    })

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Error en POST /api/folders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: {
            size: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular el tamaño total por carpeta
    const foldersWithStats = folders.map(folder => ({
      ...folder,
      totalSize: folder.images.reduce((acc, img) => acc + (img.size || 0), 0),
      images: undefined // No enviar la lista de imágenes
    }))

    return NextResponse.json(foldersWithStats)
  } catch (error) {
    console.error('Error en GET /api/folders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('id')

    if (!folderId) {
      return NextResponse.json(
        { error: 'ID de carpeta no proporcionado' },
        { status: 400 }
      )
    }

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Carpeta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la carpeta y sus imágenes (en cascada)
    await prisma.folder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /api/folders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
