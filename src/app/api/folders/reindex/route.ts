import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fsService } from '@/services/fs.server'
import path from 'path'

export async function POST() {
  try {
    // Obtener todas las carpetas
    const folders = await prisma.folder.findMany()

    console.log('Iniciando reindexado de carpetas:', folders.length)

    for (const folder of folders) {
      try {
        console.log('Reindexando carpeta:', folder.path)

        // Verificar que la carpeta aún existe
        const validation = await fsService.validatePath(folder.path)
        if (!validation.valid) {
          console.warn('Carpeta no encontrada, saltando:', folder.path)
          continue
        }

        // Obtener lista de archivos
        const files = await fsService.listFiles(folder.path)
        console.log('Archivos encontrados:', files.length)

        let totalSize = 0
        let totalFiles = 0

        // Eliminar imágenes que ya no existen
        const existingImages = await prisma.image.findMany({
          where: { folderId: folder.id },
          select: { id: true, path: true }
        })

        const currentPaths = files.map((f: any) => f.path)
        const deletedImages = existingImages.filter((img: any) => !currentPaths.includes(img.path))

        if (deletedImages.length > 0) {
          console.log('Eliminando imágenes que ya no existen:', deletedImages.length)
          await prisma.image.deleteMany({
            where: {
              id: {
                in: deletedImages.map((img: any) => img.id)
              }
            }
          })
        }

        // Procesar cada archivo
        for (const file of files) {
          if (await fsService.isImage(file.path)) {
            try {
              const existingImage = await prisma.image.findFirst({
                where: { path: file.path }
              })

              if (!existingImage) {
                const hash = await fsService.calculateFileHash(file.path)
                const metadata = await fsService.getFileMetadata(file.path)

                await prisma.image.create({
                  data: {
                    name: file.name,
                    path: file.path,
                    hash,
                    size: file.size,
                    width: 0,
                    height: 0,
                    metadata: JSON.stringify({
                      ...metadata,
                      mimeType: `image/${path.extname(file.path).slice(1)}`
                    }),
                    folderId: folder.id,
                    isPublic: false
                  }
                })

                console.log('Nueva imagen indexada:', file.name)
              } else {
                // Actualizar metadata si es necesario
                const metadata = await fsService.getFileMetadata(file.path)
                await prisma.image.update({
                  where: { id: existingImage.id },
                  data: {
                    size: file.size,
                    metadata: JSON.stringify(metadata),
                    updatedAt: new Date()
                  }
                })
              }

              totalSize += file.size
              totalFiles++
            } catch (error) {
              console.error('Error procesando imagen:', file.path, error)
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

        console.log('Carpeta reindexada:', folder.path, {
          totalFiles,
          totalSize
        })
      } catch (error) {
        console.error('Error reindexando carpeta:', folder.path, error)
        // Continuar con la siguiente carpeta
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en POST /api/folders/reindex:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
