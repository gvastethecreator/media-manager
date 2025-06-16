/**
 * @file Utilidad para formatear tamaños de archivos
 * @module utils/file/format-file-size
 */

/**
 * Formatea un tamaño en bytes a un formato legible por humanos.
 * @param bytes - El tamaño en bytes a formatear
 * @param decimals - El número de decimales a mostrar (por defecto 2)
 * @returns Una cadena formateada con el tamaño y la unidad
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}