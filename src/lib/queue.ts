import { prisma } from './prisma'
import { EventEmitter } from 'events'

interface JobData {
  imageId: string
  quality: string
  force?: boolean
}

interface QueueOptions {
  maxConcurrent?: number
  pollInterval?: number
}

class JobQueue extends EventEmitter {
  private name: string
  private maxConcurrent: number
  private pollInterval: number
  private isProcessing: boolean
  private processor: (data: any) => Promise<void>
  private interval?: NodeJS.Timeout

  constructor(name: string, options: QueueOptions = {}) {
    super()
    this.name = name
    this.maxConcurrent = options.maxConcurrent || 2
    this.pollInterval = options.pollInterval || 1000
    this.isProcessing = false
    this.processor = async () => {}
  }

  async add(data: JobData) {
    const job = await prisma.queueJob.create({
      data: {
        queue: this.name,
        data: JSON.stringify(data),
      }
    })
    
    this.emit('added', job)
    return job
  }

  process(processor: (data: any) => Promise<void>) {
    this.processor = processor
    this.startProcessing()
  }

  private async startProcessing() {
    if (this.isProcessing) return

    this.isProcessing = true
    this.interval = setInterval(async () => {
      try {
        // Obtener trabajos pendientes
        const pendingJobs = await prisma.queueJob.findMany({
          where: {
            queue: this.name,
            status: 'pending',
            attempts: {
              lt: prisma.queueJob.fields.maxAttempts
            }
          },
          take: this.maxConcurrent,
          orderBy: { createdAt: 'asc' }
        })

        // Procesar trabajos
        for (const job of pendingJobs) {
          this.processJob(job)
        }
      } catch (error) {
        console.error('Error processing queue:', error)
      }
    }, this.pollInterval)
  }

  private async processJob(job: any) {
    try {
      // Marcar como activo
      await prisma.queueJob.update({
        where: { id: job.id },
        data: {
          status: 'active',
          attempts: { increment: 1 },
          startedAt: new Date()
        }
      })

      // Procesar
      const data = JSON.parse(job.data)
      await this.processor(data)

      // Marcar como completado
      await prisma.queueJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          progress: 100
        }
      })

      this.emit('completed', job)
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error)
      
      // Marcar como fallido si excede los intentos
      if (job.attempts >= job.maxAttempts - 1) {
        await prisma.queueJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: error.message,
            finishedAt: new Date()
          }
        })
        this.emit('failed', job, error)
      }
    }
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    this.isProcessing = false
  }

  async getStatus() {
    const [pending, active, completed, failed] = await Promise.all([
      prisma.queueJob.count({ where: { queue: this.name, status: 'pending' } }),
      prisma.queueJob.count({ where: { queue: this.name, status: 'active' } }),
      prisma.queueJob.count({ where: { queue: this.name, status: 'completed' } }),
      prisma.queueJob.count({ where: { queue: this.name, status: 'failed' } })
    ])

    return { pending, active, completed, failed }
  }

  async clean(age: number = 24 * 60 * 60 * 1000) { // 24 horas por defecto
    const date = new Date(Date.now() - age)
    await prisma.queueJob.deleteMany({
      where: {
        queue: this.name,
        status: { in: ['completed', 'failed'] },
        finishedAt: { lt: date }
      }
    })
  }
}

// Crear la cola de thumbnails
export const thumbnailQueue = new JobQueue('thumbnails', {
  maxConcurrent: 2,
  pollInterval: 1000
})

// Configurar el procesador
thumbnailQueue.process(async (data: JobData) => {
  const { imageId, quality, force } = data

  const response = await fetch(`/api/images/${imageId}/thumbnail/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quality, force }),
  })

  if (!response.ok) {
    throw new Error('Error generating thumbnail')
  }
})

// Exportar funciones helper
export const queueThumbnail = async (
  imageId: string,
  quality: string,
  force = false
) => {
  return thumbnailQueue.add({ imageId, quality, force })
}

export const getQueueStatus = () => thumbnailQueue.getStatus()
