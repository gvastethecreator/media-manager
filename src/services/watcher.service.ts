import { watch } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { folderService } from './folder.service'

/**
 * @deprecated Use watcherClient from @/services/watcher instead
 */
export const watcherService = {
  activeWatchers: new Map<string, { close: () => void }>(),

  /**
   * @deprecated Use watcherClient.watchFolder instead
   */
  async watchFolder(folderId: string): Promise<void> {
    console.warn('⚠️ [Deprecated] Use watcherClient.watchFolder instead');
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

  /**
   * @deprecated Use watcherClient.unwatchFolder instead
   */
  async stopWatching(folderId: string): Promise<void> {
    console.warn('⚠️ [Deprecated] Use watcherClient.unwatchFolder instead');
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

  /**
   * @deprecated Use watcherClient.syncWatchedFolders instead
   */
  async startWatchingAll(): Promise<void> {
    console.warn('⚠️ [Deprecated] Use watcherClient.syncWatchedFolders instead');
    const folders = await prisma.folder.findMany({
      where: { isWatched: true }
    })

    for (const folder of folders) {
      await this.watchFolder(folder.id)
    }
  },

  /**
   * @deprecated Use watcherClient.stopAll instead
   */
  stopWatchingAll(): void {
    console.warn('⚠️ [Deprecated] Use watcherClient.stopAll instead');
    for (const [folderId, watcher] of this.activeWatchers) {
      watcher.close()
      this.activeWatchers.delete(folderId)
    }
  }
}
