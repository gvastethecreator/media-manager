/**
 * @file Funciones auxiliares para el manejo de imágenes
 * @module utils/image/helpers
 */

import type {
    Image,
    ImageFormat,
    ImageMetadata
} from '../../types/entities/image';
import { isValidImageFormat } from './validators';

/**
 * Calcula el tamaño formateado de una imagen en KB, MB o GB
 * @param bytes Tamaño en bytes
 * @returns Tamaño formateado con unidad
 */
export function formatImageSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

/**
 * Calcula las dimensiones formateadas de una imagen
 * @param width Ancho en píxeles
 * @param height Alto en píxeles
 * @returns Dimensiones formateadas como "Ancho × Alto"
 */
export function formatImageDimensions(width: number, height: number): string {
  return `${width} × ${height}`;
}

/**
 * Calcula las dimensiones formateadas de una imagen en MP
 * @param width Ancho en píxeles
 * @param height Alto en píxeles
 * @returns Dimensiones formateadas como megapíxeles
 */
export function calculateMegapixels(width: number, height: number): string {
  const mp = (width * height) / 1000000;
  return `${mp.toFixed(1)} MP`;
}

/**
 * Genera una URL para la miniatura de una imagen
 * @param image Imagen o ID de imagen
 * @param width Ancho opcional de la miniatura
 * @param height Alto opcional de la miniatura
 * @returns URL para la miniatura
 */
export function generateThumbnailUrl(
  image: Image | string,
  width?: number,
  height?: number
): string {
  const imageId = typeof image === 'string' ? image : image.id;
  let url = `/api/images/${imageId}/thumbnail`;

  // Añadir parámetros de tamaño si se especifican
  if (width || height) {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    url += `?${params.toString()}`;
  }

  return url;
}

/**
 * Extrae el formato de archivo de una ruta de imagen
 * @param path Ruta de la imagen
 * @returns Formato de la imagen o undefined si no se puede determinar
 */
export function getImageFormatFromPath(path: string): ImageFormat | undefined {
  const extension = path.split('.').pop()?.toLowerCase();
  if (!extension) return undefined;

  return isValidImageFormat(extension) ? extension as ImageFormat : undefined;
}

/**
 * Genera un resumen de metadatos EXIF para mostrar en la UI
 * @param metadata Metadatos de la imagen
 * @returns Objeto con los datos más relevantes para mostrar
 */
export function getExifSummary(metadata?: ImageMetadata): Record<string, string> {
  if (!metadata || !metadata.exif) {
    return {};
  }

  const exif = metadata.exif;
  const summary: Record<string, string> = {};

  // Datos de cámara
  if (exif.make) summary['Cámara'] = `${exif.make}${exif.model ? ` ${exif.model}` : ''}`;
  if (exif.lensModel) summary['Lente'] = exif.lensModel as string;

  // Configuración de disparo
  if (exif.exposureTime) summary['Exposición'] = exif.exposureTime as string;
  if (exif.fNumber) summary['Apertura'] = `f/${exif.fNumber}`;
  if (exif.iso) summary['ISO'] = `ISO ${exif.iso}`;
  if (exif.focalLength) summary['Distancia focal'] = exif.focalLength as string;

  // Fecha
  if (exif.dateTimeOriginal) {
    const date = new Date(exif.dateTimeOriginal as string);
    summary['Fecha'] = date.toLocaleDateString();
  }

  return summary;
}

/**
 * Extrae palabras clave de los metadatos de una imagen para sugerir etiquetas
 * @param metadata Metadatos de la imagen
 * @returns Array de etiquetas sugeridas
 */
export function extractTagSuggestions(metadata?: ImageMetadata): string[] {
  if (!metadata) return [];

  const suggestions: string[] = [];

  // Sugerencias de IA si están disponibles
  if (metadata.ai?.prompt) {
    const promptWords = (metadata.ai.prompt as string)
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.replace(/[,.;:!?]/g, ''));

    suggestions.push(...promptWords);
  }

  // Sugerencias de IPTC si están disponibles
  if (metadata.iptc && metadata.iptc.keywords) {
    const keywords = metadata.iptc.keywords as string[];
    suggestions.push(...keywords);
  }

  // Eliminar duplicados y limitar cantidad
  return [...new Set(suggestions)].slice(0, 10);
}

/**
 * Determina si una imagen tiene metadatos completos
 * @param image Imagen a verificar
 * @returns true si la imagen tiene metadatos EXIF o AI, false en caso contrario
 */
export function hasCompleteMetadata(image: Image): boolean {
  return !!(
    image.metadata &&
    (image.metadata.exif || image.metadata.ai)
  );
}

/**
 * Convierte una array de bytes a una imagen base64 para mostrar
 * @param buffer Array de bytes de la imagen
 * @param format Formato de la imagen
 * @returns String base64 con formato para HTML img src
 */
export function bytesToBase64Image(buffer: Uint8Array, format: string): string {
  // Convertir el buffer a una cadena base64
  const base64 = Buffer.from(buffer).toString('base64');

  // Determinar el tipo MIME según el formato
  let mimeType = 'image/jpeg'; // Valor por defecto

  if (format === 'png') mimeType = 'image/png';
  else if (format === 'webp') mimeType = 'image/webp';
  else if (format === 'gif') mimeType = 'image/gif';
  else if (format === 'svg') mimeType = 'image/svg+xml';

  // Devolver la cadena completa para usar en src de imágenes
  return `data:${mimeType};base64,${base64}`;
}