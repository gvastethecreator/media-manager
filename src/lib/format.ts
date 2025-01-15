
/**
 * Formatea una fecha a una cadena legible en español
 * @param date Fecha a formatear
 * @returns Cadena formateada (ej: "5 ene 2024, 14:30")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

/**
 * Extrae el nombre de un archivo sin su extensión
 * @param name Nombre del archivo con extensión
 * @returns Nombre sin extensión
 */
export function formatFileName(name: string): string {
  return name.replace(/\.[^/.]+$/, "")
}

/**
 * Formatea un número a una cadena con separadores de miles
 * @param num Número a formatear
 * @returns Cadena formateada (ej: "1.234.567")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num)
}

/**
 * Formatea una duración en milisegundos a una cadena legible
 * @param ms Duración en milisegundos
 * @returns Cadena formateada (ej: "2m 30s")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}