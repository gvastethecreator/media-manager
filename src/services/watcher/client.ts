import { WatcherApiResponse, WatchedFolder } from './types';

/**
 * Cliente para el servicio de observación de archivos
 * Maneja la comunicación con la API del servidor
 */
export class WatcherClient {
  private activeWatchers: Map<string, WatchedFolder> = new Map();

  /**
   * Inicia la observación de una carpeta
   */
  async watchFolder(folderId: string): Promise<void> {
    try {
      const response = await fetch('/api/folders/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId, watch: true }),
      });

      const data: WatcherApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar el monitoreo');
      }

      if (data.data) {
        this.activeWatchers.set(folderId, {
          id: folderId,
          path: data.data.folderId,
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error en watchFolder:', error);
      throw error;
    }
  }

  /**
   * Detiene la observación de una carpeta
   */
  async unwatchFolder(folderId: string): Promise<void> {
    try {
      const response = await fetch('/api/folders/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId, watch: false }),
      });

      const data: WatcherApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al detener el monitoreo');
      }

      this.activeWatchers.delete(folderId);
    } catch (error) {
      console.error('Error en unwatchFolder:', error);
      throw error;
    }
  }

  /**
   * Sincroniza el estado de las carpetas observadas
   */
  async syncWatchedFolders(): Promise<void> {
    try {
      const response = await fetch('/api/folders/watched');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al sincronizar carpetas');
      }

      // Limpiar watchers actuales
      this.activeWatchers.clear();

      // Actualizar con los datos del servidor
      for (const folder of data.folders) {
        if (folder.isWatched) {
          this.activeWatchers.set(folder.id, {
            id: folder.id,
            path: folder.path,
            isActive: true
          });
        }
      }
    } catch (error) {
      console.error('Error en syncWatchedFolders:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las carpetas actualmente observadas
   */
  getActiveWatchers(): WatchedFolder[] {
    return Array.from(this.activeWatchers.values());
  }

  /**
   * Verifica si una carpeta está siendo observada
   */
  isWatched(folderId: string): boolean {
    return this.activeWatchers.has(folderId);
  }

  /**
   * Detiene la observación de todas las carpetas
   */
  async stopAll(): Promise<void> {
    const folders = Array.from(this.activeWatchers.keys());
    for (const folderId of folders) {
      await this.unwatchFolder(folderId);
    }
  }
}

// Exportar una instancia singleton
export const watcherClient = new WatcherClient();