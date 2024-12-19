import { watch } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { fsService } from './fs.server'

class WatcherManager {
  private activeWatchers: Map<string, { close: () => void }> = new Map()

  async watchFolder(folderId: string): Promise<void> {
    try {
      // Si ya existe un watcher para esta carpeta, lo detenemos
      if (this.activeWatchers.has(folderId)) {
        await this.stopWatching(folderId)
      }

      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      })

      if (!folder) {
        console.error('Carpeta no encontrada:', folderId)
        return
      }

      console.log('Iniciando monitoreo de carpeta:', folder.path)

      const watcher = watch(
        folder.path,
        { persistent: true, recursive: true },
        async (eventType, filename) => {
          if (!filename) return

          const fullPath = path.join(folder.path, filename)
          console.log('Cambio detectado:', { eventType, fullPath })

          try {
            if (eventType === 'rename') {
              // Archivo agregado o eliminado
              const exists = await fsService.validatePath(fullPath)

              if (!exists.valid) {
                // El archivo fue eliminado
                await prisma.image.deleteMany({
                  where: { path: fullPath }
                })
                console.log('Imagen eliminada de la base de datos:', fullPath)
              } else {
                // El archivo fue agregado
                if (await fsService.isImage(fullPath)) {
                  const stats = await fsService.getFileMetadata(fullPath)
                  const hash = await fsService.calculateFileHash(fullPath)

                  // Verificar si la imagen ya existe
                  const existingImage = await prisma.image.findFirst({
                    where: { hash }
                  })

                  if (!existingImage) {
                    await prisma.image.create({
                      data: {
                        name: path.basename(filename),
                        path: fullPath,
                        hash,
                        size: stats.size,
                        mimeType: `image/${path.extname(filename).slice(1)}`,
                        metadata: JSON.stringify(stats),
                        folderId: folder.id,
                        isPublic: false
                      }
                    })
                    console.log('Nueva imagen indexada:', fullPath)
                  }
                }
              }
            } else if (eventType === 'change') {
              // Archivo modificado
              if (await fsService.isImage(fullPath)) {
                const stats = await fsService.getFileMetadata(fullPath)
                const hash = await fsService.calculateFileHash(fullPath)

                await prisma.image.updateMany({
                  where: { path: fullPath },
                  data: {
                    hash,
                    size: stats.size,
                    metadata: JSON.stringify(stats),
                    updatedAt: new Date()
                  }
                })
                console.log('Imagen actualizada:', fullPath)
              }
            }

            // Actualizar estadísticas de la carpeta
            const files = await fsService.listFiles(folder.path)
            const imageFiles = files.filter(async file => await fsService.isImage(file.path))
            const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0)

            await prisma.folder.update({
              where: { id: folder.id },
              data: {
                totalFiles: imageFiles.length,
                totalSize,
                lastIndexed: new Date()
              }
            })
          } catch (error) {
            console.error('Error procesando cambio de archivo:', error)
          }
        }
      )

      this.activeWatchers.set(folderId, {
        close: () => watcher.close()
      })

      console.log('Monitoreo iniciado para carpeta:', folder.path)
    } catch (error) {
      console.error('Error iniciando monitoreo:', error)
      throw error
    }
  }

  async stopWatching(folderId: string): Promise<void> {
    try {
      const watcher = this.activeWatchers.get(folderId)
      if (watcher) {
        watcher.close()
        this.activeWatchers.delete(folderId)
        console.log('Monitoreo detenido para carpeta:', folderId)
      }
    } catch (error) {
      console.error('Error deteniendo monitoreo:', error)
      throw error
    }
  }

  async stopAll(): Promise<void> {
    try {
      for (const [folderId, watcher] of this.activeWatchers) {
        watcher.close()
        this.activeWatchers.delete(folderId)
      }
      console.log('Todo el monitoreo detenido')
    } catch (error) {
      console.error('Error deteniendo todo el monitoreo:', error)
      throw error
    }
  }
}

// Singleton instance
export const watcherService = new WatcherManager()
