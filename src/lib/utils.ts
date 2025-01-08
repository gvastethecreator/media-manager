import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Tipos para el sistema de logging
interface LoggerOptions {
  level?: LogLevel
  prefix?: string
  isDevelopment?: boolean
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogFn = (message: string, data?: unknown) => void
type LogLevels = Record<LogLevel, number>

const LOG_LEVELS: LogLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

class Logger {
  private level: LogLevel
  private prefix: string
  private isDevelopment: boolean
  private static instance: Logger

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info'
    this.prefix = options.prefix || ''
    this.isDevelopment = options.isDevelopment ?? process.env.NODE_ENV === 'development'
  }

  private getTime(): string {
    return new Date().toISOString()
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level]
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = this.getTime()
    const prefix = this.prefix ? `[${this.prefix}] ` : ''
    const dataStr = data ? ` ${JSON.stringify(data, null, 2)}` : ''
    return `${timestamp} ${prefix}${level}: ${message}${dataStr}`
  }

  private createLogMethod(level: LogLevel): LogFn {
    return (message: string, data?: unknown): void => {
      if (!this.shouldLog(level)) return
      if (level === 'debug' && !this.isDevelopment) return
      console[level](this.formatMessage(level.toUpperCase(), message, data))
    }
  }

  debug = this.createLogMethod('debug')
  info = this.createLogMethod('info')
  warn = this.createLogMethod('warn')
  error = this.createLogMethod('error')

  child(options: LoggerOptions): Logger {
    return new Logger({
      level: options.level || this.level,
      prefix: options.prefix ? `${this.prefix}:${options.prefix}` : this.prefix,
      isDevelopment: options.isDevelopment ?? this.isDevelopment
    })
  }

  static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options)
    }
    return Logger.instance
  }
}

// Exportar instancia principal
export const logger = Logger.getInstance({ prefix: 'ImageManager' })

// Exportar instancias específicas
export const cacheLogger = logger.child({ prefix: 'Cache' })
export const metadataLogger = logger.child({ prefix: 'Metadata' })
export const thumbnailLogger = logger.child({ prefix: 'Thumbnail' })
export const queueLogger = logger.child({ prefix: 'Queue' })

/**
 * Utilidad para combinar clases CSS con Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const
type FileSizeUnit = typeof FILE_SIZE_UNITS[number]

interface FormatBytesOptions {
  decimals?: number
  unit?: FileSizeUnit
  binary?: boolean
}

/**
 * Formatea un tamaño en bytes a una cadena legible
 * @param bytes Número de bytes a formatear
 * @param options Opciones de formateo
 * @returns Cadena formateada
 */
export function formatBytes(bytes: number, options: FormatBytesOptions = {}): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'

  const {
    decimals = 2,
    binary = true,
    unit
  } = options

  const base = binary ? 1024 : 1000
  const dm = decimals < 0 ? 0 : decimals

  if (unit) {
    const unitIndex = FILE_SIZE_UNITS.indexOf(unit)
    if (unitIndex === -1) throw new Error(`Unidad inválida: ${unit}`)
    const value = bytes / Math.pow(base, unitIndex)
    return `${value.toFixed(dm)} ${unit}`
  }

  const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(base))
  const value = bytes / Math.pow(base, i)

  return `${value.toFixed(dm)} ${FILE_SIZE_UNITS[i]}`
}

/**
 * Formatea un tamaño de archivo a una cadena legible
 * @deprecated Use formatBytes instead
 */
export function formatFileSize(bytes: number): string {
  return formatBytes(bytes, { binary: true, decimals: 2 })
}

interface ThumbnailSizeOptions {
  min?: number
  max?: number
  defaultSize?: number
}

/**
 * Convierte un nivel de zoom a un tamaño de thumbnail
 * @param zoomLevel Nivel de zoom (50-200)
 * @param options Opciones de configuración
 * @returns Tamaño del thumbnail
 */
export function zoomLevelToThumbnailSize(
  zoomLevel: number,
  options: ThumbnailSizeOptions = {}
): number {
  const {
    min = 100,
    max = 400,
    defaultSize = 200
  } = options

  if (!Number.isFinite(zoomLevel) || zoomLevel < 50 || zoomLevel > 200) {
    return defaultSize
  }

  // Convertir el nivel de zoom (50-200) a un tamaño de thumbnail (min-max)
  const size = Math.floor((zoomLevel / 100) * defaultSize)
  return Math.max(min, Math.min(max, size))
}

export function formatDate(date: string | Date) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd MMM yyyy", { locale: es });
}

// Exportar tipos útiles
export type { LoggerOptions, LogLevel, FileSizeUnit }
