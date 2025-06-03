/**
 * @file Utilidad para escanear carpetas del sistema de archivos
 * @module lib/folder-scanner
 * @description Proporciona funciones para escanear carpetas y obtener información de sus archivos
 */

import fs from 'fs/promises';
import path from 'path';
import { serverLogger } from './logger/server-logger';
import { normalizePath } from './path-utils';

// Logger específico para el scanner de carpetas
const scannerLogger = serverLogger.withContext('FolderScanner');

// Extensiones de archivos admitidas por defecto (imágenes, videos)
const DEFAULT_SUPPORTED_EXTENSIONS = [
  // Imágenes
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif', '.svg',
  // Videos
  '.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v'
];

/**
 * Interfaz para los resultados del escaneo de carpetas - OPTIMIZADA ⚡
 */
export interface FolderScanResult {
  path: string;               // Ruta de la carpeta escaneada
  files: FileInfo[];          // Lista de archivos encontrados
  directories: DirectoryInfo[]; // Lista de subcarpetas encontradas
  totalFiles: number;         // Total de archivos (incluye subcarpetas si recursive es true)
  totalDirectories: number;   // Total de directorios
  totalSize: number;          // Tamaño total en bytes
  scannedAt: Date;            // Fecha y hora del escaneo
  error?: string;             // Error si ocurrió alguno
  // 🚀 NUEVAS PROPIEDADES OPTIMIZADAS
  stats?: ScanStats;          // Estadísticas clasificadas de archivos
  images: FileInfo[];         // Archivos de imagen (acceso directo)
  videos: FileInfo[];         // Archivos de video (acceso directo)
  others: FileInfo[];         // Otros archivos (acceso directo)
}

/**
 * Interfaz para información de archivos
 */
export interface FileInfo {
  name: string;         // Nombre del archivo con extensión
  path: string;         // Ruta completa al archivo
  relativePath: string; // Ruta relativa desde la carpeta base
  extension: string;    // Extensión del archivo (con punto)
  size: number;         // Tamaño en bytes
  modifiedAt: Date;     // Fecha de última modificación
  isDirectory: false;   // Flag para indicar que es un archivo
}

/**
 * Interfaz para información de directorios
 */
export interface DirectoryInfo {
  name: string;         // Nombre del directorio
  path: string;         // Ruta completa al directorio
  relativePath: string; // Ruta relativa desde la carpeta base
  modifiedAt: Date;     // Fecha de última modificación
  isDirectory: true;    // Flag para indicar que es un directorio
}

/**
 * Opciones para el escaneo de carpetas
 */
export interface ScanFolderOptions {
  recursive?: boolean;                 // Escanear subcarpetas recursivamente
  maxDepth?: number;                   // Profundidad máxima de escaneo (si recursive es true)
  includeExtensions?: string[];        // Extensiones a incluir (con punto)
  excludeExtensions?: string[];        // Extensiones a excluir (con punto)
  includeHidden?: boolean;             // Incluir archivos/carpetas ocultos
  sortFiles?: 'name' | 'size' | 'date'; // Ordenar archivos por
  sortDirection?: 'asc' | 'desc';      // Dirección de ordenación
  limit?: number;                      // Límite de archivos a devolver
}

/**
 * Escanea una carpeta y devuelve información sobre sus archivos
 * @param folderPath Ruta de la carpeta a escanear
 * @param options Opciones de escaneo
 * @returns Resultado del escaneo con información de archivos y carpetas
 */
export async function scanFolder(
  folderPath: string,
  options: ScanFolderOptions = {}
): Promise<FolderScanResult> {
  // Normalizar ruta
  const normalizedPath = normalizePath(folderPath);
  scannerLogger.info('🔍 Iniciando escaneo de carpeta:', { path: normalizedPath, options });

  // Opciones por defecto
  const {
    recursive = false,
    maxDepth = 3,
    includeExtensions = DEFAULT_SUPPORTED_EXTENSIONS,
    excludeExtensions = [],
    includeHidden = false,
    sortFiles = 'name',
    sortDirection = 'asc',
    limit = 1000
  } = options;
  // Resultado inicial - OPTIMIZADO ⚡
  const result: FolderScanResult = {
    path: normalizedPath,
    files: [],
    directories: [],
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    scannedAt: new Date(),
    // 🚀 Inicializar nuevas propiedades optimizadas
    images: [],
    videos: [],
    others: []
  };

  try {
    // Verificar que la carpeta existe
    await fs.access(normalizedPath);

    // Escanear la carpeta
    await scanDirectory(
      normalizedPath,
      normalizedPath,
      result,
      {
        recursive,
        currentDepth: 0,
        maxDepth,
        includeExtensions,
        excludeExtensions,
        includeHidden,
        limit
      }
    );

    // Ordenar archivos según las opciones
    sortFileList(result.files, sortFiles, sortDirection);    // Aplicar límite
    if (limit > 0 && result.files.length > limit) {
      result.files = result.files.slice(0, limit);
    }

    // 🚀 OPTIMIZACIÓN: Generar estadísticas al final
    result.stats = extractScanStats(result.files);

    scannerLogger.info('✅ Escaneo completado:', {
      path: normalizedPath,
      totalFiles: result.totalFiles,
      totalDirectories: result.totalDirectories,
      totalSize: result.totalSize,
      images: result.images.length,
      videos: result.videos.length,
      others: result.others.length
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    scannerLogger.error('❌ Error escaneando carpeta:', { path: normalizedPath, error });

    result.error = errorMessage;
    return result;
  }
}

/**
 * Escanea un directorio recursivamente (función interna) - OPTIMIZADO ⚡
 */
async function scanDirectory(
  basePath: string,
  currentPath: string,
  result: FolderScanResult,
  options: {
    recursive: boolean;
    currentDepth: number;
    maxDepth: number;
    includeExtensions: string[];
    excludeExtensions: string[];
    includeHidden: boolean;
    limit: number;
  }
): Promise<void> {
  // Si ya alcanzamos el límite, no seguir escaneando
  if (options.limit > 0 && result.files.length >= options.limit) {
    return;
  }

  try {
    // Leer contenido del directorio
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    // 🚀 OPTIMIZACIÓN: Procesar archivos y directorios en paralelo
    const filePromises: Promise<void>[] = [];
    const directoryPromises: Promise<void>[] = [];

    for (const entry of entries) {
      // Saltar archivos ocultos si no están habilitados
      if (!options.includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isFile()) {
        // 🚀 Procesar archivos en paralelo
        filePromises.push(processFileEntry(fullPath, relativePath, result, options));
      } else if (entry.isDirectory() && options.recursive && options.currentDepth < options.maxDepth) {
        // 🚀 Procesar directorios en paralelo
        directoryPromises.push(processDirectoryEntry(fullPath, relativePath, basePath, result, options));
      }
    }

    // Procesar todos los archivos en paralelo (máximo 10 concurrent)
    const chunks = chunkArray(filePromises, 10);
    for (const chunk of chunks) {
      await Promise.all(chunk);
    }    // Procesar directorios recursivamente en paralelo (máximo 5 concurrent)
    const dirChunks = chunkArray(directoryPromises, 5);
    for (const chunk of dirChunks) {
      await Promise.all(chunk);
    }

  } catch (error) {
    scannerLogger.error('Error escaneando subdirectorio:', { path: currentPath, error });
    // Continuar con otros directorios en caso de error
  }
}

/**
 * Ordena la lista de archivos según criterios especificados
 */
function sortFileList(
  files: FileInfo[],
  sortBy: 'name' | 'size' | 'date',
  direction: 'asc' | 'desc'
): void {
  const directionMultiplier = direction === 'asc' ? 1 : -1;

  files.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return directionMultiplier * a.name.localeCompare(b.name);
      case 'size':
        return directionMultiplier * (a.size - b.size);
      case 'date':
        return directionMultiplier * (a.modifiedAt.getTime() - b.modifiedAt.getTime());
      default:
        return 0;
    }
  });
}

/**
 * Verifica si una carpeta existe y es accesible
 * @param folderPath Ruta de la carpeta a verificar
 * @returns True si la carpeta existe y es accesible, false en caso contrario
 */
export async function folderExists(folderPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(folderPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene estadísticas básicas de una carpeta sin escanear a fondo
 * @param folderPath Ruta de la carpeta
 * @returns Información básica de la carpeta
 */
export async function getFolderStats(folderPath: string): Promise<{
  exists: boolean;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: Date;
  error?: string;
}> {
  try {
    const stats = await fs.stat(folderPath);
    return {
      exists: true,
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      exists: false,
      isDirectory: false,
      error: errorMessage
    };
  }
}

/**
 * Información estadística optimizada del escaneo
 */
export interface ScanStats {
  images: FileInfo[];
  videos: FileInfo[];
  others: FileInfo[];
}

/**
 * Extrae estadísticas optimizadas de archivos clasificados
 * 🚀 OPTIMIZACIÓN: Clasificación durante el escaneo
 */
export function extractScanStats(files: FileInfo[]): ScanStats {
  const stats: ScanStats = {
    images: [],
    videos: [],
    others: []
  };

  // Extensiones de imágenes y videos para clasificación rápida
  const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif', '.svg']);
  const videoExtensions = new Set(['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v']);

  for (const file of files) {
    const ext = file.extension.toLowerCase();
    if (imageExtensions.has(ext)) {
      stats.images.push(file);
    } else if (videoExtensions.has(ext)) {
      stats.videos.push(file);
    } else {
      stats.others.push(file);
    }
  }

  return stats;
}

/**
 * 🚀 FUNCIONES AUXILIARES PARA OPTIMIZACIÓN
 */

/**
 * Divide un array en chunks para procesamiento paralelo controlado
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Procesa un archivo individual de forma asíncrona - OPTIMIZADO ⚡
 */
async function processFileEntry(
  fullPath: string,
  relativePath: string,
  result: FolderScanResult,
  options: {
    includeExtensions: string[];
    excludeExtensions: string[];
    limit: number;
  }
): Promise<void> {
  try {
    // Verificar límite antes de procesar
    if (options.limit > 0 && result.files.length >= options.limit) {
      return;
    }

    const stats = await fs.stat(fullPath);
    const extension = path.extname(fullPath).toLowerCase();

    // Verificar extensiones incluidas/excluidas
    const includeFile =
      (options.includeExtensions.length === 0 || options.includeExtensions.includes(extension)) &&
      !options.excludeExtensions.includes(extension);

    if (includeFile) {
      const fileInfo: FileInfo = {
        name: path.basename(fullPath),
        path: fullPath,
        relativePath,
        extension,
        size: stats.size,
        modifiedAt: stats.mtime,
        isDirectory: false
      };

      result.files.push(fileInfo);
      result.totalFiles++;
      result.totalSize += stats.size;

      // 🚀 OPTIMIZACIÓN: Clasificar archivos durante el escaneo
      const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif', '.svg']);
      const videoExtensions = new Set(['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v']);

      if (imageExtensions.has(extension)) {
        result.images.push(fileInfo);
      } else if (videoExtensions.has(extension)) {
        result.videos.push(fileInfo);
      } else {
        result.others.push(fileInfo);
      }
    }
  } catch (error) {
    scannerLogger.warn('⚠️ Error procesando archivo:', { path: fullPath, error });
  }
}

/**
 * Procesa un directorio individual de forma asíncrona
 */
async function processDirectoryEntry(
  fullPath: string,
  relativePath: string,
  basePath: string,
  result: FolderScanResult,
  options: {
    recursive: boolean;
    currentDepth: number;
    maxDepth: number;
    includeExtensions: string[];
    excludeExtensions: string[];
    includeHidden: boolean;
    limit: number;
  }
): Promise<void> {
  try {
    const stats = await fs.stat(fullPath);

    const dirInfo: DirectoryInfo = {
      name: path.basename(fullPath),
      path: fullPath,
      relativePath,
      modifiedAt: stats.mtime,
      isDirectory: true
    };

    result.directories.push(dirInfo);
    result.totalDirectories++;

    // Recursión con aumento de profundidad
    if (options.recursive && options.currentDepth < options.maxDepth) {
      await scanDirectory(basePath, fullPath, result, {
        ...options,
        currentDepth: options.currentDepth + 1
      });
    }
  } catch (error) {
    scannerLogger.warn('⚠️ Error procesando directorio:', { path: fullPath, error });
  }
}