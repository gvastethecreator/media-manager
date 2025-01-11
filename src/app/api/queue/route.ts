import { NextResponse } from 'next/server'
import { QueueService } from '@/services/queue.service'
import { logger } from '@/lib/logger'

const routeLogger = logger.withContext('QueueAPI')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queue = searchParams.get('queue')

    if (!queue) {
      return NextResponse.json(
        { error: 'Queue parameter is required' },
        { status: 400 }
      )
    }

    const jobs = await QueueService.getPendingJobs(queue)
    routeLogger.info('📋 Trabajos pendientes recuperados', {
      queue,
      count: jobs.length
    })

    return NextResponse.json(jobs)
  } catch (error) {
    routeLogger.error('❌ Error al recuperar trabajos', { error })
    return NextResponse.json(
      { error: 'Error al recuperar trabajos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const job = await QueueService.createJob(body)

    routeLogger.info('✨ Trabajo creado', {
      jobId: job.id,
      queue: job.queue
    })

    return NextResponse.json(job)
  } catch (error) {
    routeLogger.error('❌ Error al crear trabajo', { error })
    return NextResponse.json(
      { error: 'Error al crear trabajo' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const action = searchParams.get('action')

    if (!jobId || !action) {
      return NextResponse.json(
        { error: 'JobId and action parameters are required' },
        { status: 400 }
      )
    }

    let job

    switch (action) {
      case 'start':
        job = await QueueService.startJob(jobId)
        break
      case 'complete':
        job = await QueueService.completeJob(jobId)
        break
      case 'cancel':
        job = await QueueService.cancelJob(jobId)
        break
      case 'fail':
        const error = searchParams.get('error') || 'Unknown error'
        job = await QueueService.failJob(jobId, new Error(error))
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    routeLogger.info('🔄 Estado del trabajo actualizado', {
      jobId,
      action,
      status: job.status
    })

    return NextResponse.json(job)
  } catch (error) {
    routeLogger.error('❌ Error al actualizar trabajo', { error })
    return NextResponse.json(
      { error: 'Error al actualizar trabajo' },
      { status: 500 }
    )
  }
}