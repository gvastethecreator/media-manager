import { prisma } from './prisma'
import { EventEmitter } from 'events'
import { queueLogger as logger } from './utils'

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed'
export type JobPriority = 'low' | 'normal' | 'high'

export interface JobData {
  imageId: string
  quality: string
  force?: boolean
  priority?: JobPriority
}

export interface QueueOptions {
  maxConcurrent?: number
  pollInterval?: number
  maxRetries?: number
  retryDelay?: number
  cleanupAge?: number
}

export interface QueueStats {
  pending: number
  active: number
  completed: number
  failed: number
  avgProcessingTime?: number
}

interface QueueEvents {
  added: (job: unknown) => void
  started: (job: unknown) => void
  completed: (job: unknown) => void
  failed: (job: unknown, error: Error) => void
  cleaned: (count: number) => void
}

const DEFAULT_OPTIONS: Required<QueueOptions> = {
  maxConcurrent: 2,
  pollInterval: 1000,
  maxRetries: 3,
  retryDelay: 5000,
  cleanupAge: 24 * 60 * 60 * 1000 // 24 horas
}

class JobQueue extends EventEmitter {
  private name: string
  private options: Required<QueueOptions>
  private isProcessing: boolean
  private processor: (data: JobData) => Promise<void>
  private interval?: NodeJS.Timeout
  private cleanupInterval?: NodeJS.Timeout
  private processingJobs: Set<string>

  constructor(name: string, options: QueueOptions = {}) {
    super()
    this.name = name
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.isProcessing = false
    this.processor = async () => { }
    this.processingJobs = new Set()

    // Iniciar limpieza automática
    this.startCleanup()
  }

  async add(data: JobData): Promise<unknown> {
    try {
      const job = await prisma.queueJob.create({
        data: {
          queue: this.name,
          data: JSON.stringify(data),
          priority: data.priority || 'normal',
          maxAttempts: this.options.maxRetries,
          status: 'pending' as JobStatus
        }
      })

      this.emit('added', job)
      return job
    } catch (error) {
      console.error(`[Queue:${this.name}] Error adding job:`, error)
      throw error
    }
  }

  process(processor: (data: JobData) => Promise<void>): void {
    this.processor = processor
    this.startProcessing()
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true
    this.interval = setInterval(async () => {
      try {
        // Obtener trabajos pendientes por prioridad
        const pendingJobs = await prisma.queueJob.findMany({
          where: {
            queue: this.name,
            status: 'pending',
            attempts: {
              lt: prisma.queueJob.fields.maxAttempts
            },
            id: {
              notIn: Array.from(this.processingJobs)
            }
          },
          take: this.options.maxConcurrent - this.processingJobs.size,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' }
          ]
        })

        // Procesar trabajos
        for (const job of pendingJobs) {
          this.processJob(job).catch(error =>
            console.error(`[Queue:${this.name}] Error processing job ${job.id}:`, error)
          )
        }
      } catch (error) {
        console.error(`[Queue:${this.name}] Error in processing loop:`, error)
      }
    }, this.options.pollInterval)
  }

  private async processJob(job: any): Promise<void> {
    this.processingJobs.add(job.id)

    try {
      const startTime = Date.now()

      // Marcar como activo
      await prisma.queueJob.update({
        where: { id: job.id },
        data: {
          status: 'active' as JobStatus,
          attempts: { increment: 1 },
          startedAt: new Date(),
          error: null
        }
      })

      this.emit('started', job)

      // Procesar
      const data = JSON.parse(job.data) as JobData
      await this.processor(data)

      // Marcar como completado
      await prisma.queueJob.update({
        where: { id: job.id },
        data: {
          status: 'completed' as JobStatus,
          finishedAt: new Date(),
          progress: 100,
          processingTime: Date.now() - startTime
        }
      })

      this.emit('completed', job)
    } catch (error) {
      console.error(`[Queue:${this.name}] Error processing job ${job.id}:`, error)

      // Marcar como fallido si excede los intentos
      if (job.attempts >= job.maxAttempts - 1) {
        await prisma.queueJob.update({
          where: { id: job.id },
          data: {
            status: 'failed' as JobStatus,
            error: error instanceof Error ? error.message : String(error),
            finishedAt: new Date()
          }
        })
        this.emit('failed', job, error instanceof Error ? error : new Error(String(error)))
      } else {
        // Reintentar después del delay
        await prisma.queueJob.update({
          where: { id: job.id },
          data: {
            status: 'pending' as JobStatus,
            error: error instanceof Error ? error.message : String(error),
            nextAttempt: new Date(Date.now() + this.options.retryDelay)
          }
        })
      }
    } finally {
      this.processingJobs.delete(job.id)
    }
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval)
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.isProcessing = false
  }

  async getStatus(): Promise<QueueStats> {
    try {
      const [pending, active, completed, failed, avgTime] = await Promise.all([
        prisma.queueJob.count({ where: { queue: this.name, status: 'pending' } }),
        prisma.queueJob.count({ where: { queue: this.name, status: 'active' } }),
        prisma.queueJob.count({ where: { queue: this.name, status: 'completed' } }),
        prisma.queueJob.count({ where: { queue: this.name, status: 'failed' } }),
        prisma.queueJob.aggregate({
          where: { queue: this.name, status: 'completed' },
          _avg: { processingTime: true }
        })
      ])

      return {
        pending,
        active,
        completed,
        failed,
        avgProcessingTime: avgTime._avg.processingTime || undefined
      }
    } catch (error) {
      console.error(`[Queue:${this.name}] Error getting status:`, error)
      throw error
    }
  }

  private startCleanup(): void {
    // Limpiar trabajos viejos cada hora
    this.cleanupInterval = setInterval(async () => {
      try {
        const result = await this.clean()
        if (result > 0) {
          this.emit('cleaned', result)
        }
      } catch (error) {
        console.error(`[Queue:${this.name}] Error in cleanup:`, error)
      }
    }, 60 * 60 * 1000)
  }

  async clean(age: number = this.options.cleanupAge): Promise<number> {
    try {
      const date = new Date(Date.now() - age)
      const result = await prisma.queueJob.deleteMany({
        where: {
          queue: this.name,
          status: { in: ['completed', 'failed'] },
          finishedAt: { lt: date }
        }
      })
      return result.count
    } catch (error) {
      console.error(`[Queue:${this.name}] Error cleaning queue:`, error)
      throw error
    }
  }
}

// Crear la cola de thumbnails
export const thumbnailQueue = new JobQueue('thumbnails', {
  maxConcurrent: 2,
  pollInterval: 1000,
  maxRetries: 3,
  retryDelay: 5000
})

// Configurar el procesador
thumbnailQueue.process(async (data: JobData) => {
  const { imageId, quality, force } = data

  try {
    logger.info('Procesando thumbnail:', { imageId, quality, force })

    const response = await fetch(`/api/images/${imageId}/thumbnail/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quality, force }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error generating thumbnail')
    }

    const result = await response.json()
    logger.info('Thumbnail procesado:', result)
    return result
  } catch (error) {
    logger.error('Error en cola de thumbnails:', {
      imageId,
      quality,
      error: error instanceof Error ? error.message : error
    })
    throw error // Permitir reintento
  }
})

// Exportar funciones helper
export const queueThumbnail = async (
  imageId: string,
  quality: string,
  force = false,
  priority: JobPriority = 'normal'
): Promise<unknown> => {
  return thumbnailQueue.add({ imageId, quality, force, priority })
}

export const getQueueStatus = (): Promise<QueueStats> => thumbnailQueue.getStatus()
