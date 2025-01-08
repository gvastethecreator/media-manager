import { formatBytes } from "@/lib/utils"
import { thumbnailCache } from "@/lib/cache"
import { PrismaClient } from '@prisma/client'
import { EventSourcePolyfill as EventSource } from 'event-source-polyfill'
import { logger } from '@/lib/logger'
import { EventsService } from './events.service'
import { thumbnailEventService } from './thumbnail-events.service'
import sharp from 'sharp'
import { stat } from 'fs/promises'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'

// Verificar si estamos en el cliente o servidor
const isClient = typeof window !== 'undefined'
const EventSourceImpl = isClient ? window.EventSource : EventSource

const prisma = new PrismaClient()

// Crear una instancia específica para el servicio de thumbnails
const thumbLogger = logger.withContext('ThumbnailService')

// Configuración base para las URLs
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Configuración de límites
const LIMITS = {
  MAX_PIXELS: 40000000, // 40 megapíxeles
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DIMENSION: 8000 // 8000px
} as const;

export interface ThumbnailStats {
  total: number
  totalSize: number
  pending: number
  withThumbnail: number
  recentlyProcessed: {
    id: string
    path: string
    processedAt: Date
  }[]
  errors: ThumbnailError[]
}

export interface ThumbnailError {
  imageId: string
  imagePath: string
  error: string
  timestamp: Date
}

export type ThumbnailQuality = 'compressed' | 'low' | 'mid' | 'high'

export interface ThumbnailConfig {
  quality: ThumbnailQuality
  width: number
  height: number
  format: 'webp'
}

export interface ProcessStatus {
  status?: string
  current?: number
  total?: number
  progress?: number
  currentFile?: string
  lastProcessed?: {
    id: string
    path: string
    processedAt: string
  }
}

export interface ThumbnailCallbacks {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: Error) => void
  onComplete?: (data: any) => void
}

export interface ProcessOptions extends ThumbnailCallbacks {
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export interface ThumbnailOptions {
  quality?: ThumbnailQuality
  width?: number
  height?: number
  format?: 'webp'
}

// Constantes para los nombres de eventos
const EVENTS = {
  PROGRESS: 'progress',
  ERROR: 'error',
  COMPLETE: 'complete',
  STATS: 'stats'
} as const;

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, { quality: number, width: number, height: number }> = {
  compressed: { quality: 60, width: 200, height: 200 },
  low: { quality: 70, width: 300, height: 300 },
  mid: { quality: 80, width: 400, height: 400 },
  high: { quality: 90, width: 500, height: 500 }
}

export type ThumbnailEventCallback = (event: { type: string, data: any }) => void;

export class ThumbnailService {
  private static instance: ThumbnailService
  private isProcessing = false
  private preGenerationQueue: Set<string> = new Set()
  private isProcessingQueue = false
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly PROCESS_TIMEOUT = 60000; // 1 minuto
  private eventsService: EventsService | null = null

  constructor() {
    thumbLogger.info('Initializing ThumbnailService')
    this.startQueueProcessor()
  }

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService()
    }
    return ThumbnailService.instance
  }

  private getFullUrl(path: string): string {
    const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${normalizedPath}`
  }

  private async fetchWithTimeout(
    input: string,
    init?: RequestInit,
    timeout = 45000
  ): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const url = this.getFullUrl(input)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  private setupEventHandlers(callbacks?: ThumbnailCallbacks) {
    const handleProgress = (data: ProcessStatus) => {
      if (!data) return;

      // Validar y normalizar los datos
      const status: ProcessStatus = {
        status: typeof data.status === 'string' ? data.status : "Procesando...",
        current: typeof data.current === 'number' ? data.current : 0,
        total: typeof data.total === 'number' ? data.total : 0,
        progress: typeof data.progress === 'number' ? data.progress : 0,
        currentFile: typeof data.currentFile === 'string' ? data.currentFile : undefined
      };

      if (data.lastProcessed && typeof data.lastProcessed === 'object') {
        status.lastProcessed = {
          id: String(data.lastProcessed.id),
          path: String(data.lastProcessed.path),
          processedAt: String(data.lastProcessed.processedAt)
        };
      }

      callbacks?.onProgress?.(status);
      thumbnailEventService.emitProgress(status);
      thumbLogger.debug('📊 Progreso:', status);
    };

    const handleError = (error: unknown) => {
      let formattedError: Error;

      if (error instanceof Error) {
        formattedError = error;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        formattedError = new Error(
          typeof errorObj.message === 'string'
            ? errorObj.message
            : 'Error desconocido'
        );

        if ('code' in errorObj) {
          (formattedError as any).code = errorObj.code;
        }
        if ('details' in errorObj) {
          (formattedError as any).details = errorObj.details;
        }
      } else {
        formattedError = new Error(String(error));
      }

      callbacks?.onError?.(formattedError);
      thumbnailEventService.emitError(formattedError);
      thumbLogger.error('❌ Error:', formattedError);
    };

    const handleComplete = (data: any) => {
      try {
        // Validar y normalizar los datos
        const normalizedData = {
          processed: typeof data?.processed === 'number' ? data.processed : 0,
          optimized: typeof data?.optimized === 'number' ? data.optimized : 0,
          cleaned: typeof data?.cleaned === 'number' ? data.cleaned : 0,
          totalSaved: typeof data?.totalSaved === 'number' ? data.totalSaved : 0,
          totalFreed: typeof data?.totalFreed === 'number' ? data.totalFreed : 0,
          errors: Array.isArray(data?.errors) ? data.errors : []
        };

        callbacks?.onComplete?.(normalizedData);
        thumbnailEventService.emitComplete(normalizedData);
        thumbLogger.info('✅ Proceso completado:', normalizedData);
      } catch (error) {
        thumbLogger.error('❌ Error procesando datos de completado:', error);
        handleError(error);
      }
    };

    const handleStats = (data: any) => {
      try {
        // Validar y normalizar los datos
        if (!data || typeof data !== 'object') {
          throw new Error('Datos de estadísticas inválidos');
        }

        const normalizedStats = {
          total: typeof data.total === 'number' ? data.total : 0,
          totalSize: typeof data.totalSize === 'number' ? data.totalSize : 0,
          pending: typeof data.pending === 'number' ? data.pending : 0,
          withThumbnail: typeof data.withThumbnail === 'number' ? data.withThumbnail : 0,
          errors: Array.isArray(data.errors) ? data.errors : [],
          recentlyProcessed: Array.isArray(data.recentlyProcessed) ? data.recentlyProcessed : []
        };

        thumbnailEventService.emitStats(normalizedStats);
        thumbLogger.debug('📈 Estadísticas actualizadas:', normalizedStats);
      } catch (error) {
        thumbLogger.error('❌ Error procesando estadísticas:', error);
        handleError(error);
      }
    };

    return {
      [EVENTS.PROGRESS]: handleProgress,
      [EVENTS.ERROR]: handleError,
      [EVENTS.COMPLETE]: handleComplete,
      [EVENTS.STATS]: handleStats
    };
  }

  private async handleProcess(endpoint: string, callbacks?: ThumbnailCallbacks): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Ya hay un proceso en ejecución')
    }

    this.isProcessing = true
    const handlers = this.setupEventHandlers(callbacks)

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Error iniciando el proceso');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo iniciar la lectura del stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const [eventType, ...dataLines] = line.split('\n');
            const event = eventType.replace('event: ', '');
            const data = dataLines.join('\n').replace('data: ', '');
            const parsedData = JSON.parse(data);

            switch (event) {
              case 'progress':
                handlers[EVENTS.PROGRESS](parsedData);
                break;
              case 'error':
                handlers[EVENTS.ERROR](parsedData);
                break;
              case 'complete':
                handlers[EVENTS.COMPLETE](parsedData);
                break;
              case 'stats':
                handlers[EVENTS.STATS](parsedData);
                break;
            }
          } catch (error) {
            thumbLogger.error('Error procesando evento:', error);
          }
        }
      }
    } catch (error) {
      const formattedError = {
        message: 'Error en la conexión',
        details: error instanceof Error ? error.message : 'Error desconocido',
        originalError: error
      };
      thumbLogger.error('Error en el proceso:', formattedError);
      throw formattedError;
    } finally {
      this.isProcessing = false;
    }
  }

  async optimizeThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail optimization')
      await this.handleProcess('/api/thumbnails/optimize', options)
      thumbLogger.info('Thumbnail optimization completed')
    } catch (error) {
      thumbLogger.error('Error optimizing thumbnails:', error)
      throw error
    }
  }

  async cleanThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail cleanup')
      await this.handleProcess('/api/thumbnails/clean', options)
      thumbLogger.info('Thumbnail cleanup completed')
    } catch (error) {
      thumbLogger.error('Error cleaning thumbnails:', error)
      throw error
    }
  }

  async reprocessAll(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail reprocessing')
      await this.handleProcess('/api/thumbnails/reprocess', options)
      thumbLogger.info('Thumbnail reprocessing completed')
    } catch (error) {
      thumbLogger.error('Error reprocessing thumbnails:', error)
      throw error
    }
  }

  private async startQueueProcessor() {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true
    while (this.preGenerationQueue.size > 0) {
      const [nextId] = this.preGenerationQueue
      this.preGenerationQueue.delete(nextId)

      try {
        await this.generateThumbnail(nextId, { quality: 'mid' })
      } catch (error) {
        console.error('Error pre-generando thumbnail:', error)
      }

      // Esperar un poco entre cada generación para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    this.isProcessingQueue = false
  }

  async getThumbnail(imageId: string, quality: ThumbnailQuality): Promise<string> {
    try {
      const cacheKey = `thumbnail:${imageId}:${quality}`

      // Intentar obtener del caché
      const cached = await thumbnailCache.get(cacheKey)
      if (cached) {
        return cached
      }

      // Si no está en caché, intentar obtener con reintentos
      let attempts = 0
      let lastError: Error | null = null

      while (attempts < this.MAX_RETRIES) {
        try {
          const response = await this.fetchWithTimeout(
            `/api/thumbnails/${imageId}?quality=${quality}`,
            {
              headers: {
                'Accept': 'image/webp',
                'Cache-Control': 'no-cache'
              }
            }
          )

          if (!response.ok) {
            const error = await response.text()
            throw new Error(error || 'Error obteniendo miniatura')
          }

          const blob = await response.blob()
          const base64 = await this.blobToBase64(blob)

          // Guardar en caché
          await thumbnailCache.set(cacheKey, base64)

          return base64
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Error desconocido')
          attempts++
          if (attempts < this.MAX_RETRIES) {
            await new Promise(resolve =>
              setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempts - 1))
            )
          }
        }
      }

      // Si llegamos aquí, agregar a la cola de pre-generación
      this.preGenerationQueue.add(imageId)
      this.startQueueProcessor()

      throw lastError || new Error('Error al obtener la miniatura después de reintentos')
    } catch (error) {
      console.error('Error en getThumbnail:', error)
      throw error instanceof Error ? error : new Error('Error al obtener la miniatura')
    }
  }

  async generateThumbnail(
    imagePath: string,
    options: ThumbnailOptions = {},
    retryCount = 0
  ): Promise<string> {
    try {
      // Validar imagen antes de procesar
      await this.validateImage(imagePath);

      const thumbnailPath = await this.generateThumbnailInternal(imagePath, options);
      return thumbnailPath;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retryCount)));
        return this.generateThumbnail(imagePath, options, retryCount + 1);
      }
      throw new Error(`Error al generar la miniatura después de ${this.MAX_RETRIES} reintentos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async generateThumbnailInternal(
    imagePath: string,
    options: ThumbnailOptions
  ): Promise<string> {
    const { quality = 'mid', width, height } = options;

    // Validar que el archivo existe
    if (!await this.fileExists(imagePath)) {
      throw new Error(`El archivo no existe: ${imagePath}`);
    }

    // Obtener el hash del archivo
    const fileHash = await this.getFileHash(imagePath);

    // Generar path de la miniatura
    const thumbnailPath = this.getThumbnailPath(fileHash, quality);

    // Si ya existe y no está corrupto, retornar
    if (await this.isValidThumbnail(thumbnailPath)) {
      return thumbnailPath;
    }

    // Procesar la imagen
    await this.processImage(imagePath, thumbnailPath, { quality, width, height });

    // Verificar que se generó correctamente
    if (!await this.isValidThumbnail(thumbnailPath)) {
      throw new Error('La miniatura generada no es válida');
    }

    return thumbnailPath;
  }

  private async isValidThumbnail(thumbnailPath: string): Promise<boolean> {
    try {
      if (!await this.fileExists(thumbnailPath)) {
        return false;
      }

      // Intentar abrir la imagen para verificar que no está corrupta
      const metadata = await sharp(thumbnailPath).metadata();
      return Boolean(metadata.width && metadata.height);
    } catch {
      return false;
    }
  }

  async queueThumbnailGeneration(imageIds: string[]): Promise<void> {
    imageIds.forEach(id => this.preGenerationQueue.add(id))
    this.startQueueProcessor()
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes)
  }

  getQualityConfig(quality: ThumbnailQuality) {
    return THUMBNAIL_QUALITY_CONFIG[quality]
  }

  cancelProcessing() {
    if (this.isProcessing) {
      this.eventsService?.disconnect()
      this.eventsService = null
      this.isProcessing = false
      thumbLogger.info('Processing cancelled')
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async getStats(): Promise<ThumbnailStats> {
    try {
      const response = await this.fetchWithTimeout('/api/thumbnails/stats', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Error obteniendo estadísticas')
      }

      return await response.json()
    } catch (error) {
      thumbLogger.error('Error en getStats:', error)
      throw error
    }
  }

  async reprocessThumbnails(callbacks?: ThumbnailCallbacks): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Ya hay un proceso en ejecución');
    }

    this.isProcessing = true;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.PROCESS_TIMEOUT);

    try {
      const response = await fetch('/api/thumbnails/reprocess', {
        method: 'POST',
        signal: abortController.signal,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Error iniciando el reprocesamiento');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo iniciar la lectura del stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const events = text.split('\n\n').filter(Boolean);

        for (const event of events) {
          const [type, ...dataLines] = event.split('\n');
          const data = dataLines.join('\n').replace('data: ', '');

          try {
            const parsedData = JSON.parse(data);
            switch (type.replace('event: ', '')) {
              case 'progress':
                callbacks?.onProgress?.(parsedData);
                break;
              case 'error':
                callbacks?.onError?.(new Error(parsedData.message));
                break;
              case 'complete':
                callbacks?.onComplete?.(parsedData);
                break;
            }
          } catch (error) {
            logger.error('Error procesando evento:', error);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('El proceso excedió el tiempo límite');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      this.isProcessing = false;
    }
  }

  private async validateImage(imagePath: string): Promise<void> {
    try {
      const metadata = await sharp(imagePath).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('No se pudieron obtener las dimensiones de la imagen');
      }

      const pixels = metadata.width * metadata.height;

      if (pixels > LIMITS.MAX_PIXELS) {
        throw new Error(`La imagen excede el límite de píxeles (${LIMITS.MAX_PIXELS})`);
      }

      if (metadata.width > LIMITS.MAX_DIMENSION || metadata.height > LIMITS.MAX_DIMENSION) {
        throw new Error(`La imagen excede la dimensión máxima permitida (${LIMITS.MAX_DIMENSION}px)`);
      }
    } catch (error) {
      throw new Error(`Error validando imagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path)
      return true
    } catch {
      return false
    }
  }

  private async processImage(
    inputPath: string,
    outputPath: string,
    options: { quality: ThumbnailQuality; width?: number; height?: number }
  ): Promise<void> {
    const config = THUMBNAIL_QUALITY_CONFIG[options.quality]
    await sharp(inputPath)
      .resize(options.width || config.width, options.height || config.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: config.quality })
      .toFile(outputPath)
  }

  private async getFileHash(filePath: string): Promise<string> {
    const buffer = await readFile(filePath)
    return createHash('sha256').update(buffer).digest('hex')
  }

  private getThumbnailPath(fileHash: string, quality: ThumbnailQuality): string {
    const thumbnailDir = process.env.THUMBNAIL_DIR || './thumbnails'
    return `${thumbnailDir}/${fileHash}_${quality}.webp`
  }
}

export const thumbnailService = ThumbnailService.getInstance()
