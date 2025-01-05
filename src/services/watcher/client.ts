import { WatcherConfig, WatcherEvents, WatchedFolder, WatcherApiResponse } from './types';

export class WatcherClient {
  private activeWatchers: Map<string, boolean>;
  private config: WatcherConfig;

  constructor(config: WatcherConfig = {}) {
    this.activeWatchers = new Map();
    this.config = config;
  }

  private logError(method: string, error: Error): void {
    if (!this.config.isTestEnvironment) {
      console.error(`[WatcherClient] Error en ${method}:`, error);
    }
  }

  async watchFolder(folderId: string): Promise<void> {
    try {
      const response = await fetch(`/api/folders/${folderId}/watch`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data: WatcherApiResponse = await response.json();
        throw new Error(data.error || 'Error al iniciar el monitoreo');
      }

      this.activeWatchers.set(folderId, true);
    } catch (error) {
      this.logError('watchFolder', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async unwatchFolder(folderId: string): Promise<void> {
    try {
      const response = await fetch(`/api/folders/${folderId}/watch`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data: WatcherApiResponse = await response.json();
        throw new Error(data.error || 'Error al detener el monitoreo');
      }

      this.activeWatchers.delete(folderId);
    } catch (error) {
      this.logError('unwatchFolder', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async syncWatchedFolders(): Promise<void> {
    try {
      const response = await fetch('/api/folders/watched');
      if (!response.ok) {
        throw new Error('Error al sincronizar carpetas monitoreadas');
      }

      const folders: WatchedFolder[] = await response.json();
      this.activeWatchers.clear();

      folders.forEach(folder => {
        if (folder.isWatched) {
          this.activeWatchers.set(folder.id, true);
        }
      });
    } catch (error) {
      this.logError('syncWatchedFolders', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async stopAll(): Promise<void> {
    try {
      const watchers = Array.from(this.activeWatchers.keys());
      await Promise.all(watchers.map(folderId => this.unwatchFolder(folderId)));
      this.activeWatchers.clear();
    } catch (error) {
      this.logError('stopAll', error instanceof Error ? error : new Error(String(error)));
      // No lanzamos el error aquí para permitir una limpieza parcial
      this.activeWatchers.clear(); // Limpiamos el estado interno de todas formas
    }
  }

  getActiveWatchers(): string[] {
    return Array.from(this.activeWatchers.keys());
  }

  isWatched(folderId: string): boolean {
    return this.activeWatchers.has(folderId);
  }
}