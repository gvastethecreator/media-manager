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

/**
 * Realiza una fusión profunda de objetos
 * @param target Objeto destino
 * @param source Objeto fuente
 * @returns Objeto combinado
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key as keyof T] = deepMerge(target[key as keyof T], source[key]) as T[keyof T]
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item))
}

// Exportar tipos útiles
export type { LoggerOptions, LogLevel, FileSizeUnit }

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function (...args: Parameters<T>): void {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(ext);
}
