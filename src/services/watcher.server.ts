import { prisma } from '@/lib/db'
import chokidar from 'chokidar'
import path from 'path'

/**
 * @deprecated Use watcherServer from @/services/watcher instead
 */
let watcher: chokidar.FSWatcher | null = null

/**
 * @deprecated Use watcherServer.initialize instead
 */
export async function initializeWatcher() {
  console.warn('⚠️ [Deprecated] Use watcherServer.initialize instead');
  try {
    // Obtener carpetas monitoreadas
    const watchedFolders = await prisma.folder.findMany({
      where: { isWatched: true }
    })

    if (watchedFolders.length === 0) {
      console.log('👀 [Watcher] No hay carpetas monitoreadas')
      return true
    }

    // Iniciar el watcher
    watcher = chokidar.watch(watchedFolders.map(f => f.path), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    })

    // Configurar eventos
    watcher
      .on('add', path => console.log(`👀 [Watcher] Nuevo archivo detectado: ${path}`))
      .on('unlink', path => console.log(`👀 [Watcher] Archivo eliminado: ${path}`))
      .on('error', error => console.error('❌ [Watcher] Error:', error))

    console.log(`👀 [Watcher] Monitoreando ${watchedFolders.length} carpetas`)
    return true
  } catch (error) {
    console.error('❌ [Watcher] Error al inicializar:', error)
    throw error
  }
}

/**
 * @deprecated Use watcherServer.stop instead
 */
export function stopWatcher() {
  console.warn('⚠️ [Deprecated] Use watcherServer.stop instead');
  if (watcher) {
    watcher.close()
    watcher = null
    console.log('👀 [Watcher] Monitoreo detenido')
  }
}
