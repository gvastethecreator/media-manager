import { NextResponse } from 'next/server'
import { ActivityService } from '@/services/activity.service'
import { logger } from '@/lib/logger'

const routeLogger = logger.withContext('ActivityAPI')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const imageId = searchParams.get('imageId')
    const limit = parseInt(searchParams.get('limit') || '10')

    let activities

    if (type) {
      activities = await ActivityService.getActivitiesByType(type, limit)
    } else if (imageId) {
      activities = await ActivityService.getActivitiesByImage(imageId, limit)
    } else {
      activities = await ActivityService.getRecentActivities(limit)
    }

    routeLogger.info('📋 Actividades recuperadas', { count: activities.length })
    return NextResponse.json(activities)
  } catch (error) {
    routeLogger.error('❌ Error al recuperar actividades', { error })
    return NextResponse.json(
      { error: 'Error al recuperar actividades' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const activity = await ActivityService.logActivity(body)

    routeLogger.info('✨ Actividad creada', { activityId: activity.id })
    return NextResponse.json(activity)
  } catch (error) {
    routeLogger.error('❌ Error al crear actividad', { error })
    return NextResponse.json(
      { error: 'Error al crear actividad' },
      { status: 500 }
    )
  }
}