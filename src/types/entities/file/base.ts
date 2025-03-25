/**
 * @file Tipos base para la entidad File
 * @module types/entities/file/base
 */

/**
 * Interfaz básica para información de archivo
 */
export interface FileBase {
  // Propiedades de identificación
  id: string;
  name: string;
  path: string;

  // Propiedades de sistema
  type: string;
  extension: string;
  mimeType: string;
  size: number;

  // Propiedades de temporalidad
  createdAt: Date;
  modifiedAt: Date;
  accessedAt?: Date;

  // Estado
  isDirectory: boolean;
  isHidden?: boolean;
  isSystem?: boolean;
  isReadOnly?: boolean;
}

/**
 * Interfaz para información extendida de un archivo
 */
export interface FileInfo extends FileBase {
  // Propiedades adicionales para archivos
  parentPath?: string;
  absolutePath?: string;
  relativePath?: string;

  // Metadatos del sistema de archivos
  owner?: string;
  permissions?: string;
  checksum?: string;
}

/**
 * Interfaz para información de directorio
 */
export interface DirectoryInfo extends FileBase {
  // Un directorio siempre tiene isDirectory = true
  isDirectory: true;

  // Propiedades específicas de directorio
  itemCount?: number;
  children?: FileBase[];
  hasSubdirectories?: boolean;
}

/**
 * Interfaz para información básica de un archivo de imagen
 */
export interface ImageFileInfo extends FileInfo {
  width?: number;
  height?: number;
  colorDepth?: number;
  hasAlpha?: boolean;
  orientation?: number;
}

/**
 * Opciones de filtrado para listado de archivos
 */
export interface FileFilterOptions {
  pattern?: string;
  extensions?: string[];
  types?: string[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  includeHidden?: boolean;
  includeSystem?: boolean;
  recursive?: boolean;
  sortBy?: 'name' | 'size' | 'type' | 'created' | 'modified';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Respuesta de operación de lectura de directorio
 */
export interface DirectoryReadResult {
  path: string;
  items: FileBase[];
  totalItems: number;
  hasMore: boolean;
  directories: number;
  files: number;
}

/**
 * Resultado de operación sobre archivo
 */
export interface FileOperationResult {
  success: boolean;
  path?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Resultado de operación de copia/movimiento
 */
export interface FileCopyMoveResult extends FileOperationResult {
  sourcePath: string;
  destinationPath: string;
  overwritten?: boolean;
}

/**
 * Opciones para operaciones de archivo
 */
export interface FileOperationOptions {
  overwrite?: boolean;
  createDirectories?: boolean;
  preserveTimestamps?: boolean;
  recursive?: boolean;
}