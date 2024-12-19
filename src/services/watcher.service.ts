import { watch } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { folderService } from './folder.service'

export const watcherService = {
  activeWatchers: new Map<string, { close: () => void }>(),

  // Iniciar el monitoreo de una carpeta
  async watchFolder(folderId: string): Promise<void> {
    try {
      const response = await fetch('/api/folders/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId, watch: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al iniciar el monitoreo')
      }
    } catch (error) {
      console.error('Error en watchFolder:', error)
      throw error
    }
  },

  // Detener el monitoreo de una carpeta
  async stopWatching(folderId: string): Promise<void> {
    try {
      const response = await fetch('/api/folders/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId, watch: false }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al detener el monitoreo')
      }
    } catch (error) {
      console.error('Error en stopWatching:', error)
      throw error
    }
  },

  // Iniciar el monitoreo de todas las carpetas observadas
  async startWatchingAll(): Promise<void> {
    const folders = await prisma.folder.findMany({
      where: { isWatched: true }
    })

    for (const folder of folders) {
      await this.watchFolder(folder.id)
    }
  },

  // Detener todo el monitoreo
  stopWatchingAll(): void {
    for (const [folderId, watcher] of this.activeWatchers) {
      watcher.close()
      this.activeWatchers.delete(folderId)
    }
  }
}
