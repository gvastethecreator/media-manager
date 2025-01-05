/**
 * Tipos para el sistema de observación de archivos
 * @module WatcherTypes
 */

/**
 * Eventos emitidos por el sistema de observación
 */
export interface WatcherEvents {
  onFileAdded?: (path: string) => void;
  onFileDeleted?: (path: string) => void;
  onFileChanged?: (path: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Configuración para el sistema de observación
 */
export interface WatcherConfig {
  isTestEnvironment?: boolean;
}

/**
 * Estado de una carpeta observada
 */
export interface WatchedFolder {
  id: string;
  path: string;
  isWatched: boolean;
}

/**
 * Respuesta de la API de observación
 */
export interface WatcherApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    folderId: string;
    isWatched: boolean;
  };
}