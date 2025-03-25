/**
 * @file Mappers para la entidad File
 * @module transformers/file/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    DirectoryInfo,
    EnhancedDirectory,
    EnhancedImageFile,
    FILE_EXTENSION_GROUPS,
    FileBase,
    FileFilterOptions,
    FileInfo,
    FileListItem,
    FileType
} from '@/types/entities/file';
import path from 'path';

const mappersLogger = serverLogger.withContext('File:Mappers');

/**
 * Genera un ID único para un archivo basado en su ruta
 * @param filePath Ruta del archivo
 * @returns ID único para el archivo
 */
export function generateFileId(filePath: string): string {
  try {
    // Normalizar la ruta y convertirla a formato compatible con ID
    const normalizedPath = path.normalize(filePath)
      .replace(/\\/g, '/') // Reemplazar backslashes por forward slashes
      .replace(/^\/+|\/+$/g, ''); // Eliminar slashes al inicio y final

    // Codificar la ruta como base64 para obtener un ID único
    return Buffer.from(normalizedPath).toString('base64');
  } catch (error) {
    mappersLogger.error('Error generando ID para archivo:', error);
    // Fallback a un ID basado en timestamp
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Determina el tipo de archivo basado en su extensión
 * @param extension Extensión del archivo (con punto)
 * @returns Tipo de archivo
 */
export function determineFileType(extension: string): FileType {
  if (!extension) return FileType.OTHER;

  // Normalizar la extensión a minúsculas
  const normalizedExt = extension.toLowerCase();

  // Comprobar por tipo usando las constantes predefinidas
  if (FILE_EXTENSION_GROUPS.IMAGE.includes(normalizedExt)) {
    return FileType.IMAGE;
  } else if (FILE_EXTENSION_GROUPS.VIDEO.includes(normalizedExt)) {
    return FileType.VIDEO;
  } else if (FILE_EXTENSION_GROUPS.AUDIO.includes(normalizedExt)) {
    return FileType.AUDIO;
  } else if (FILE_EXTENSION_GROUPS.DOCUMENT.includes(normalizedExt)) {
    return FileType.DOCUMENT;
  } else if (FILE_EXTENSION_GROUPS.ARCHIVE.includes(normalizedExt)) {
    return FileType.ARCHIVE;
  }

  return FileType.FILE;
}

/**
 * Determina el tipo MIME basado en la extensión del archivo
 * @param extension Extensión del archivo
 * @returns Tipo MIME del archivo
 */
export function determineMimeType(extension: string): string {
  if (!extension) return 'application/octet-stream';

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
  };

  const normalizedExt = extension.toLowerCase();
  return normalizedExt in mimeTypes ? mimeTypes[normalizedExt] : 'application/octet-stream';
}

/**
 * Mapea stats del sistema de archivos a interfaz FileInfo
 * @param filePath Ruta del archivo
 * @param stats Estadísticas del sistema de archivos
 * @returns Información del archivo
 */
export function mapStatsToFileInfo(filePath: string, stats: any): FileInfo {
  const isDirectory = stats.isDirectory();
  const name = path.basename(filePath);
  const extension = isDirectory ? '' : path.extname(filePath);

  const fileInfo: FileInfo = {
    id: generateFileId(filePath),
    name,
    path: filePath,
    type: isDirectory ? FileType.DIRECTORY : determineFileType(extension),
    extension,
    mimeType: isDirectory ? 'directory' : determineMimeType(extension),
    size: stats.size,
    createdAt: stats.birthtime || stats.ctime,
    modifiedAt: stats.mtime,
    accessedAt: stats.atime,
    isDirectory,
    parentPath: path.dirname(filePath),
    absolutePath: path.resolve(filePath),
    relativePath: path.relative(process.cwd(), filePath),
  };

  return fileInfo;
}

/**
 * Convierte un FileInfo a FileListItem para UI
 * @param fileInfo Información del archivo
 * @returns Representación del archivo para listados UI
 */
export function toFileListItem(fileInfo: FileInfo): FileListItem {
  return {
    id: fileInfo.id,
    path: fileInfo.path,
    name: fileInfo.name,
    type: fileInfo.type,
    size: fileInfo.size,
    isDirectory: fileInfo.isDirectory,
    extension: fileInfo.extension,
    modifiedAt: fileInfo.modifiedAt,
    createdAt: fileInfo.createdAt,
    icon: getIconForFileType(fileInfo.type, fileInfo.extension),
    iconColor: getColorForFileType(fileInfo.type),
  };
}

/**
 * Obtiene un ícono representativo para el tipo de archivo
 * @param fileType Tipo de archivo
 * @param extension Extensión opcional
 * @returns String con el ícono para el tipo
 */
export function getIconForFileType(fileType: string, extension?: string): string {
  // Mapeo de íconos por tipo
  const iconMap: Record<string, string> = {
    [FileType.DIRECTORY]: '📁',
    [FileType.FILE]: '📄',
    [FileType.IMAGE]: '🖼️',
    [FileType.VIDEO]: '🎬',
    [FileType.AUDIO]: '🎵',
    [FileType.DOCUMENT]: '📝',
    [FileType.ARCHIVE]: '🗄️',
    [FileType.OTHER]: '❓',
  };

  // Íconos especiales por extensión
  const extensionIconMap: Record<string, string> = {
    '.pdf': '📑',
    '.doc': '📘',
    '.docx': '📘',
    '.xls': '📊',
    '.xlsx': '📊',
    '.ppt': '📽️',
    '.pptx': '📽️',
    '.txt': '📃',
    '.md': '📝',
    '.json': '🔍',
    '.zip': '📦',
    '.rar': '📦',
  };

  // Primero intentar con extensión específica
  if (extension && extension in extensionIconMap) {
    return extensionIconMap[extension];
  }

  // Sino, usar el ícono por tipo
  return iconMap[fileType] || iconMap[FileType.OTHER];
}

/**
 * Obtiene un color representativo para el tipo de archivo
 * @param fileType Tipo de archivo
 * @returns Código de color para el tipo
 */
export function getColorForFileType(fileType: string): string {
  // Mapeo de colores por tipo
  const colorMap: Record<string, string> = {
    [FileType.DIRECTORY]: '#3b82f6', // blue
    [FileType.FILE]: '#64748b', // slate
    [FileType.IMAGE]: '#10b981', // emerald
    [FileType.VIDEO]: '#f97316', // orange
    [FileType.AUDIO]: '#8b5cf6', // violet
    [FileType.DOCUMENT]: '#0ea5e9', // sky
    [FileType.ARCHIVE]: '#f59e0b', // amber
    [FileType.OTHER]: '#6b7280', // gray
  };

  return colorMap[fileType] || colorMap[FileType.OTHER];
}

/**
 * Convierte FileInfo a EnhancedDirectory si es un directorio
 * @param fileInfo Información del archivo
 * @param childItems Elementos contenidos en el directorio
 * @returns Directorio con información enriquecida
 */
export function toEnhancedDirectory(fileInfo: FileInfo, childItems: FileBase[] = []): EnhancedDirectory | null {
  if (!fileInfo.isDirectory) return null;

  try {
    // Calcular estadísticas de contenido
    const stats = {
      fileTypes: {} as Record<string, number>,
      totalSize: 0,
      lastModified: fileInfo.modifiedAt,
      averageFileSize: 0,
    };

    // Contador para tipos de archivo
    const contentSummary = {
      images: 0,
      videos: 0,
      documents: 0,
      others: 0,
    };

    // Procesar items
    if (childItems.length > 0) {
      // Inicializar contadores
      let totalFileSize = 0;
      let fileCount = 0;

      // Procesar cada item
      childItems.forEach(item => {
        if (!item.isDirectory) {
          // Contar por tipo
          if (!(item.type in stats.fileTypes)) {
            stats.fileTypes[item.type] = 0;
          }
          stats.fileTypes[item.type]++;

          // Sumar tamaños
          totalFileSize += item.size;
          fileCount++;

          // Actualizar fecha última modificación
          if (item.modifiedAt > stats.lastModified) {
            stats.lastModified = item.modifiedAt;
          }

          // Contar por categoría
          if (item.type === FileType.IMAGE) {
            contentSummary.images++;
          } else if (item.type === FileType.VIDEO) {
            contentSummary.videos++;
          } else if (item.type === FileType.DOCUMENT) {
            contentSummary.documents++;
          } else {
            contentSummary.others++;
          }
        }
      });

      // Calcular tamaño total y promedio
      stats.totalSize = totalFileSize;
      stats.averageFileSize = fileCount > 0 ? totalFileSize / fileCount : 0;
    }

    // Crear objeto de directorio enriquecido
    const enhancedDir: EnhancedDirectory = {
      ...fileInfo as unknown as DirectoryInfo,
      isDirectory: true,
      iconUrl: '/icons/folder.svg',
      thumbnailUrl: childItems.some(item => item.type === FileType.IMAGE)
        ? '/api/directory-thumbnail?path=' + encodeURIComponent(fileInfo.path)
        : undefined,
      itemCount: childItems.length,
      hasSubdirectories: childItems.some(item => item.isDirectory),
      children: childItems,
      stats,
      contentSummary,
    };

    return enhancedDir;
  } catch (error) {
    mappersLogger.error('Error al convertir a directorio enriquecido:', error);
    return {
      ...fileInfo as unknown as DirectoryInfo,
      isDirectory: true,
      itemCount: childItems.length,
      children: childItems,
    };
  }
}

/**
 * Convierte FileInfo a EnhancedImageFile si es una imagen
 * @param fileInfo Información del archivo
 * @param imageMetadata Metadatos adicionales de la imagen
 * @returns Imagen con información enriquecida
 */
export function toEnhancedImageFile(fileInfo: FileInfo, imageMetadata?: any): EnhancedImageFile | null {
  if (fileInfo.type !== FileType.IMAGE) return null;

  try {
    // Crear objeto base de imagen
    const baseImageFile: ImageFileInfo = {
      ...fileInfo,
      width: imageMetadata?.width || 0,
      height: imageMetadata?.height || 0,
      colorDepth: imageMetadata?.depth || 24,
      hasAlpha: imageMetadata?.hasAlpha || false,
      orientation: imageMetadata?.orientation || 1,
    };

    // Crear la versión enriquecida
    const enhancedImageFile: EnhancedImageFile = {
      ...baseImageFile,
      thumbnailUrl: `/api/thumbnails?path=${encodeURIComponent(fileInfo.path)}`,
      previewUrl: `/api/preview?path=${encodeURIComponent(fileInfo.path)}`,
      metadata: {
        // Extraer y mapear metadatos de EXIF si existen
        exif: imageMetadata?.exif ? {
          make: imageMetadata.exif.make,
          model: imageMetadata.exif.model,
          dateTime: imageMetadata.exif.dateTime,
          exposureTime: imageMetadata.exif.exposureTime,
          fNumber: imageMetadata.exif.fNumber,
          iso: imageMetadata.exif.iso,
          focalLength: imageMetadata.exif.focalLength,
          lens: imageMetadata.exif.lens,
          gps: imageMetadata.exif.gps ? {
            latitude: imageMetadata.exif.gps.latitude,
            longitude: imageMetadata.exif.gps.longitude,
            altitude: imageMetadata.exif.gps.altitude,
          } : undefined,
        } : undefined,

        // Extraer y mapear metadatos IPTC si existen
        iptc: imageMetadata?.iptc ? {
          title: imageMetadata.iptc.title,
          caption: imageMetadata.iptc.caption,
          keywords: imageMetadata.iptc.keywords,
          copyright: imageMetadata.iptc.copyright,
          author: imageMetadata.iptc.author,
        } : undefined,

        // Otros metadatos técnicos
        colorProfile: imageMetadata?.colorProfile,
        colorSpace: imageMetadata?.colorSpace,
        imageType: imageMetadata?.format,
        compression: imageMetadata?.compression,
        bitDepth: imageMetadata?.bitDepth,
      },
    };

    return enhancedImageFile;
  } catch (error) {
    mappersLogger.error('Error al convertir a imagen enriquecida:', error);
    return null;
  }
}

/**
 * Aplica filtros a un listado de archivos
 * @param files Lista de archivos a filtrar
 * @param options Opciones de filtrado
 * @returns Lista filtrada de archivos
 */
export function applyFileFilters(files: FileBase[], options: FileFilterOptions): FileBase[] {
  try {
    if (!options || Object.keys(options).length === 0) {
      return files;
    }

    let filteredFiles = [...files];

    // Filtrar por patrón de nombre
    if (options.pattern) {
      const pattern = new RegExp(options.pattern, 'i');
      filteredFiles = filteredFiles.filter(file => pattern.test(file.name));
    }

    // Filtrar por extensiones
    if (options.extensions && options.extensions.length > 0) {
      filteredFiles = filteredFiles.filter(file => {
        if (file.isDirectory) return true; // Mantener directorios
        const fileExt = path.extname(file.name).toLowerCase();
        return options.extensions!.includes(fileExt);
      });
    }

    // Filtrar por tipos
    if (options.types && options.types.length > 0) {
      filteredFiles = filteredFiles.filter(file => {
        if (file.isDirectory && options.types!.includes(FileType.DIRECTORY)) return true;
        return options.types!.includes(file.type);
      });
    }

    // Filtrar por tamaño
    if (options.minSize !== undefined) {
      filteredFiles = filteredFiles.filter(file => file.isDirectory || file.size >= options.minSize!);
    }
    if (options.maxSize !== undefined) {
      filteredFiles = filteredFiles.filter(file => file.isDirectory || file.size <= options.maxSize!);
    }

    // Filtrar por fecha de modificación
    if (options.modifiedAfter) {
      filteredFiles = filteredFiles.filter(file => file.modifiedAt >= options.modifiedAfter!);
    }
    if (options.modifiedBefore) {
      filteredFiles = filteredFiles.filter(file => file.modifiedAt <= options.modifiedBefore!);
    }

    // Filtrar archivos ocultos
    if (options.includeHidden === false) {
      filteredFiles = filteredFiles.filter(file => !file.isHidden);
    }

    // Filtrar archivos de sistema
    if (options.includeSystem === false) {
      filteredFiles = filteredFiles.filter(file => !file.isSystem);
    }

    // Ordenar resultados
    if (options.sortBy) {
      filteredFiles.sort((a, b) => {
        let comparison = 0;

        // Siempre mostrar directorios primero independientemente del ordenamiento
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;

        // Ordenar según el criterio especificado
        switch (options.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'created':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'modified':
            comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
            break;
          default:
            comparison = a.name.localeCompare(b.name);
        }

        // Aplicar dirección de ordenamiento
        return options.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filteredFiles;
  } catch (error) {
    mappersLogger.error('Error al aplicar filtros a archivos:', error);
    return files; // Devolver lista original en caso de error
  }
}