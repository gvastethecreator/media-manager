import { prisma } from '@/lib/prisma'
import { queueEventEmitter, QUEUE_EVENTS } from '@/lib/events'
import { logger } from '@/lib/logger'

const queueLogger = logger.withContext('QueueService')

export class QueueService {
  static async createJob(data: {
    queue: string
    data: any
    priority?: number
    metadata?: any
  }) {
    const job = await prisma.queueJob.create({
      data: {
        queue: data.queue,
        data: JSON.stringify(data.data),
        priority: data.priority || 0,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    })

    queueEventEmitter.emit(QUEUE_EVENTS.JOB_CREATED, job)
    queueLogger.info('📝 Trabajo creado', { jobId: job.id, queue: job.queue })

    return job
  }

  static async startJob(jobId: string) {
    const job = await prisma.queueJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        startedAt: new Date()
      }
    })

    queueEventEmitter.emit(QUEUE_EVENTS.JOB_STARTED, job)
    queueLogger.info('▶️ Trabajo iniciado', { jobId })

    return job
  }

  static async completeJob(jobId: string) {
    const job = await prisma.queueJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        finishedAt: new Date()
      }
    })

    queueEventEmitter.emit(QUEUE_EVENTS.JOB_COMPLETED, job)
    queueLogger.info('✅ Trabajo completado', { jobId })

    return job
  }

  static async failJob(jobId: string, error: Error) {
    const job = await prisma.queueJob.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      throw new Error('Job not found')
    }

    const shouldRetry = job.attempts < job.maxAttempts

    const updatedJob = await prisma.queueJob.update({
      where: { id: jobId },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        error: error.message,
        attempts: job.attempts + 1,
        retryAt: shouldRetry ? new Date(Date.now() + 5 * 60 * 1000) : null // Retry in 5 minutes
      }
    })

    if (shouldRetry) {
      queueEventEmitter.emit(QUEUE_EVENTS.JOB_RETRYING, updatedJob)
      queueLogger.warn('🔄 Trabajo fallido, reintentando', { jobId, error: error.message })
    } else {
      queueEventEmitter.emit(QUEUE_EVENTS.JOB_FAILED, updatedJob)
      queueLogger.error('❌ Trabajo fallido definitivamente', { jobId, error: error.message })
    }

    return updatedJob
  }

  static async cancelJob(jobId: string) {
    const job = await prisma.queueJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        finishedAt: new Date()
      }
    })

    queueEventEmitter.emit(QUEUE_EVENTS.JOB_CANCELLED, job)
    queueLogger.info('⏹️ Trabajo cancelado', { jobId })

    return job
  }

  static async getNextJob(queue: string) {
    return prisma.queueJob.findFirst({
      where: {
        queue,
        status: 'pending',
        retryAt: {
          lte: new Date()
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })
  }

  static async getPendingJobs(queue: string) {
    return prisma.queueJob.findMany({
      where: {
        queue,
        status: 'pending'
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })
  }
}