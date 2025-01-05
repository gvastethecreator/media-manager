import { prisma } from '@/lib/db';
import chokidar from 'chokidar';
import path from 'path';
import { WatcherConfig, WatcherEvents } from './types';

/**
 * Servidor de observación de archivos
 * Maneja la lógica de observación usando chokidar
 */
export class WatcherServer {
  private watcher: chokidar.FSWatcher | null = null;
  private watchedPaths: Set<string> = new Set();
  private events: Partial<WatcherEvents> = {};
  private config: Required<WatcherConfig>;

  constructor(config: WatcherConfig = {}) {
    this.config = {
      stabilityThreshold: config.stabilityThreshold ?? 2000,
      pollInterval: config.pollInterval ?? 100,
      ignoreInitial: config.ignoreInitial ?? true
    };
  }

  /**
   * Inicializa el observador con las rutas especificadas
   */
  async initialize(paths: string[] = []): Promise<void> {
    try {
      // Si no se proporcionan rutas, obtener de la base de datos
      if (paths.length === 0) {
        const watchedFolders = await prisma.folder.findMany({
          where: { isWatched: true }
        });
        paths = watchedFolders.map(f => f.path);
      }

      if (paths.length === 0) {
        console.log('👀 [Watcher] No hay carpetas monitoreadas');
        return;
      }

      // Inicializar watcher
      this.watcher = chokidar.watch(paths, {
        persistent: true,
        ignoreInitial: this.config.ignoreInitial,
        awaitWriteFinish: {
          stabilityThreshold: this.config.stabilityThreshold,
          pollInterval: this.config.pollInterval
        }
      });

      // Configurar eventos
      this.watcher
        .on('add', path => {
          console.log(`👀 [Watcher] Nuevo archivo detectado: ${path}`);
          this.events.onFileAdd?.(path);
        })
        .on('change', path => {
          console.log(`👀 [Watcher] Archivo modificado: ${path}`);
          this.events.onFileChange?.(path);
        })
        .on('unlink', path => {
          console.log(`👀 [Watcher] Archivo eliminado: ${path}`);
          this.events.onFileRemove?.(path);
        })
        .on('error', error => {
          console.error('❌ [Watcher] Error:', error);
          this.events.onError?.(error);
        });

      paths.forEach(p => this.watchedPaths.add(p));
      console.log(`👀 [Watcher] Monitoreando ${paths.length} carpetas`);
    } catch (error) {
      console.error('❌ [Watcher] Error al inicializar:', error);
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Agrega una nueva ruta al observador
   */
  async addPath(path: string): Promise<void> {
    if (this.watchedPaths.has(path)) return;

    try {
      await this.watcher?.add(path);
      this.watchedPaths.add(path);
      console.log(`👀 [Watcher] Nueva carpeta monitoreada: ${path}`);
    } catch (error) {
      console.error(`❌ [Watcher] Error al agregar ruta ${path}:`, error);
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Remueve una ruta del observador
   */
  async removePath(path: string): Promise<void> {
    if (!this.watchedPaths.has(path)) return;

    try {
      await this.watcher?.unwatch(path);
      this.watchedPaths.delete(path);
      console.log(`👀 [Watcher] Carpeta removida: ${path}`);
    } catch (error) {
      console.error(`❌ [Watcher] Error al remover ruta ${path}:`, error);
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Detiene el observador y limpia los recursos
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.watchedPaths.clear();
      console.log('👀 [Watcher] Monitoreo detenido');
    }
  }

  /**
   * Registra manejadores de eventos
   */
  on<K extends keyof WatcherEvents>(
    event: K,
    handler: WatcherEvents[K]
  ): void {
    this.events[event] = handler;
  }

  /**
   * Remueve manejadores de eventos
   */
  off<K extends keyof WatcherEvents>(event: K): void {
    delete this.events[event];
  }
}

// Exportar una instancia singleton
export const watcherServer = new WatcherServer();