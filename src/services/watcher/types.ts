/**
 * Tipos para el sistema de observación de archivos
 * @module WatcherTypes
 */

/**
 * Eventos emitidos por el sistema de observación
 */
export interface WatcherEvents {
  onFileAdd: (path: string) => void;
  onFileRemove: (path: string) => void;
  onFileChange: (path: string) => void;
  onError: (error: Error) => void;
}

/**
 * Configuración para el sistema de observación
 */
export interface WatcherConfig {
  /** Tiempo en ms para considerar un archivo como estable después de escritura */
  stabilityThreshold?: number;
  /** Intervalo en ms para verificar la estabilidad del archivo */
  pollInterval?: number;
  /** Si se deben ignorar los archivos existentes al iniciar */
  ignoreInitial?: boolean;
}

/**
 * Estado de una carpeta observada
 */
export interface WatchedFolder {
  id: string;
  path: string;
  isActive: boolean;
}

/**
 * Respuesta de la API de observación
 */
export interface WatcherApiResponse {
  success: boolean;
  error?: string;
  data?: {
    folderId: string;
    isWatched: boolean;
  };
}