export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = Math.abs(bytes)
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  // Redondear a 2 decimales si es necesario
  const formattedSize = unitIndex === 0 ? Math.round(size) : Number(size.toFixed(2))

  return `${formattedSize} ${units[unitIndex]}`
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export function formatFileName(name: string): string {
  if (!name) return ''
  const MAX_LENGTH = 32

  if (name.length <= MAX_LENGTH) return name

  const extension = name.split('.').pop()
  const baseName = name.slice(0, name.lastIndexOf('.'))

  if (!extension) return name.slice(0, MAX_LENGTH) + '...'

  const availableLength = MAX_LENGTH - extension.length - 3 // 3 por '...' y '.'
  const truncatedName = baseName.slice(0, availableLength) + '...' + '.' + extension

  return truncatedName
}