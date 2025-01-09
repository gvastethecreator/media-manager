import { logger } from '@/lib/logger'
import { optimizeThumbnail } from '@/lib/thumbnails'

const thumbLogger = logger.withContext('ThumbnailService')

export enum EVENTS {
  PROGRESS = 'progress',
  ERROR = 'error',
  COMPLETE = 'complete',
  STATS = 'stats'
}

export type ThumbnailQuality = 'compressed' | 'low' | 'medium' | 'high';

export interface ThumbnailError {
  imageId: string
  imagePath: string
  error: string
  timestamp: Date | string
}

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, { quality: number, width: number, height: number }> = {
  compressed: { quality: 60, width: 200, height: 200 },
  low: { quality: 70, width: 300, height: 300 },
  medium: { quality: 80, width: 400, height: 400 },
  high: { quality: 90, width: 500, height: 500 }
}

export interface ProcessOptions {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: any) => void
  onComplete?: (data: any) => void
  onStats?: (stats: any) => void
}

export interface ProcessStatus {
  status?: string
  currentFile?: string
  current?: number
  total?: number
  progress?: number
  lastProcessed?: {
    id: string
    path: string
    processedAt: string
    saved?: number
  }
}

export class ThumbnailService {
  private static instance: ThumbnailService;
  private isProcessing: boolean = false;

  private constructor() {
    thumbLogger.info('Initializing ThumbnailService')
  }

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService()
    }
    return ThumbnailService.instance
  }

  private setupEventHandlers(callbacks?: ProcessOptions) {
    return {
      [EVENTS.PROGRESS]: (data: any) => {
        callbacks?.onProgress?.(data)
      },
      [EVENTS.ERROR]: (error: any) => {
        callbacks?.onError?.(error)
      },
      [EVENTS.COMPLETE]: (data: any) => {
        callbacks?.onComplete?.(data)
      },
      [EVENTS.STATS]: (stats: any) => {
        callbacks?.onStats?.(stats)
      }
    }
  }

  private getFullUrl(path: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return new URL(normalizedPath, baseUrl).toString()
  }

  private async fetchWithTimeout(
    input: string,
    init?: RequestInit & { timeout?: number }
  ): Promise<Response> {
    const { timeout = 45000, ...restInit } = init || {}
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const url = this.getFullUrl(input)
      const response = await fetch(url, {
        ...restInit,
        signal: controller.signal
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  private async handleProcess(endpoint: string, callbacks?: ProcessOptions): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Ya hay un proceso en ejecución')
    }

    this.isProcessing = true
    const handlers = this.setupEventHandlers(callbacks)

    try {
      const response = await this.fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Error iniciando el proceso: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No se pudo iniciar la lectura del stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const [eventType, ...dataLines] = line.split('\n')
            const event = eventType.replace('event: ', '')
            const data = dataLines.join('\n').replace('data: ', '')
            const parsedData = JSON.parse(data)

            switch (event) {
              case EVENTS.PROGRESS:
                handlers[EVENTS.PROGRESS](parsedData)
                break
              case EVENTS.ERROR:
                handlers[EVENTS.ERROR](parsedData)
                break
              case EVENTS.COMPLETE:
                handlers[EVENTS.COMPLETE](parsedData)
                break
              case EVENTS.STATS:
                handlers[EVENTS.STATS](parsedData)
                break
            }
          } catch (error) {
            thumbLogger.error('Error procesando evento:', error)
          }
        }
      }
    } catch (error) {
      const formattedError = {
        message: 'Error en la conexión',
        details: error instanceof Error ? error.message : 'Error desconocido',
        originalError: error
      }
      thumbLogger.error('Error en el proceso:', formattedError)
      throw formattedError
    } finally {
      this.isProcessing = false
    }
  }

  async optimizeThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail optimization')
      await this.handleProcess('api/thumbnails/optimize', options)
      thumbLogger.info('Thumbnail optimization completed')
    } catch (error) {
      thumbLogger.error('Error optimizing thumbnails:', error)
      throw error
    }
  }

  async cleanThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail cleanup')
      await this.handleProcess('api/thumbnails/clean', options)
      thumbLogger.info('Thumbnail cleanup completed')
    } catch (error) {
      thumbLogger.error('Error cleaning thumbnails:', error)
      throw error
    }
  }

  async reprocessAll(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail reprocessing')
      await this.handleProcess('api/thumbnails/reprocess', options)
      thumbLogger.info('Thumbnail reprocessing completed')
    } catch (error) {
      thumbLogger.error('Error reprocessing thumbnails:', error)
      throw error
    }
  }
}

export const thumbnailService = ThumbnailService.getInstance();
