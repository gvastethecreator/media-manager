import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fsService } from '@/services/fs.server'
import path from 'path'
import { getImageMetadata } from '@/lib/image.server'
import { computeHash } from '@/lib/server-utils'

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
    let processedFiles = 0

    // Filtrar solo archivos de imagen
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.path)
    )

    // Indexar archivos
    for (const file of imageFiles) {
      try {
        const hash = await computeHash(file.path)
        console.log('🔄 Procesando archivo:', file.path)
        const metadata = await getImageMetadata(file.path)
        console.log('📝 Metadata extraída:', metadata)
        
        // Limpiar la metadata eliminando valores undefined
        const cleanMetadata = JSON.parse(JSON.stringify(metadata))
        console.log('🧹 Metadata limpia:', cleanMetadata)

        await prisma.image.create({
          data: {
            name: file.name,
            path: file.path,
            hash,
            size: file.size,
            mimeType: `image/${path.extname(file.path).slice(1)}`,
            metadata: JSON.stringify(cleanMetadata),
            folderId: folder.id,
            isPublic: false,
            width: metadata.dimensions?.width || 0,
            height: metadata.dimensions?.height || 0
          }
        })

        totalSize += file.size
        totalFiles++
        processedFiles++

        // Actualizar progreso parcial cada 10 archivos
        if (processedFiles % 10 === 0) {
          await prisma.folder.update({
            where: { id: folderId },
            data: {
              totalFiles: processedFiles,
              totalSize,
              lastIndexed: new Date()
            }
          })
        }
      } catch (error) {
        console.error('Error indexando imagen:', file.path, error)
        // Continuar con el siguiente archivo
      }
    }

    // Actualizar estadísticas finales de la carpeta
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        totalFiles,
        totalSize,
        lastIndexed: new Date()
      }
    })

    return NextResponse.json({
      folder: updatedFolder,
      stats: {
        totalFiles,
        processedFiles,
        totalSize,
        success: true
      }
    })
  } catch (error) {
    console.error('Error en POST /api/folders/reindex/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
