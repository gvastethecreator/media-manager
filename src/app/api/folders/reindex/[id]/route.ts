import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fsService } from '@/services/fs.server'
import path from 'path'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const folderId = params.id

    // Obtener la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Carpeta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar imágenes existentes
    await prisma.image.deleteMany({
      where: { folderId }
    })

    // Listar archivos
    const files = await fsService.listFiles(folder.path)
    console.log('Archivos encontrados:', files.length)

    let totalSize = 0
    let totalFiles = 0

    // Indexar archivos
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
        } catch (error) {
          console.error('Error indexando imagen:', file.path, error)
          // Continuar con el siguiente archivo
        }
      }
    }

    // Actualizar estadísticas de la carpeta
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        totalFiles,
        totalSize,
        lastIndexed: new Date()
      }
    })

    return NextResponse.json(updatedFolder)
  } catch (error) {
    console.error('Error en POST /api/folders/reindex/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
