import { NextResponse } from 'next/server'
import { getDatabaseStatus, getPrismaClient } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

const statusLogger = logger.withContext("SystemStatus");

// Función auxiliar para transformar BigInts en la respuesta
function serializeResponse(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return Number(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeResponse)
  }

  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeResponse(value)])
    )
  }

  return obj
}

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    const dbStatus = await getDatabaseStatus()

    // Si la base de datos está inicializándose, retornar estado de inicialización
    if (dbStatus.status === 'initializing') {
      return NextResponse.json(serializeResponse({
        status: 'initializing',
        message: 'Sistema inicializándose',
        database: dbStatus,
        fileSystem: {
          status: 'pending',
          message: 'Esperando inicialización de la base de datos'
        },
        thumbnails: {
          status: 'pending',
          message: 'Esperando inicialización del sistema'
        },
        settings: {
          status: 'pending',
          message: 'Esperando inicialización del sistema'
        }
      }))
    }

    // Si hay un error en la base de datos, retornar error
    if (dbStatus.status === 'error') {
      return NextResponse.json(serializeResponse({
        status: 'error',
        error: dbStatus.message,
        database: dbStatus,
        fileSystem: {
          status: 'error',
          message: 'Error en el sistema de archivos'
        },
        thumbnails: {
          status: 'error',
          message: 'Error en el servicio de miniaturas'
        },
        settings: {
          status: 'error',
          message: 'Error al cargar configuraciones'
        }
      }), { status: 500 })
    }

    // Si la base de datos está conectada, continuar con las verificaciones
    const prisma = await getPrismaClient()

    // Verificar sistema de archivos
    const thumbnailsDir = path.join(process.cwd(), 'thumbnails')
    try {
      await fs.access(thumbnailsDir)
    } catch {
      statusLogger.info('Creando directorio de miniaturas...')
      await fs.mkdir(thumbnailsDir, { recursive: true })
    }

    // Verificar permisos de escritura en thumbnails
    try {
      const testFile = path.join(thumbnailsDir, '.test')
      await fs.writeFile(testFile, '')
      await fs.unlink(testFile)
    } catch (error) {
      statusLogger.error('Error de permisos en thumbnails:', error)
      throw new Error('No hay permisos de escritura en el directorio de miniaturas')
    }

    // Verificar settings.json
    const settingsPath = path.join(process.cwd(), 'settings.json')
    try {
      await fs.access(settingsPath)
    } catch {
      statusLogger.error('No se encontró settings.json')
      throw new Error('No se encontró el archivo de configuración')
    }

    // Obtener estadísticas de miniaturas
    const imagesWithoutThumbnails = Number(await prisma.image.count({
      where: { thumbnail: null }
    }))

    interface TestResult {
      test: number
    }

    // Verificar estado del sistema
    const systemChecks = {
      database: Number((await prisma.$queryRaw<TestResult[]>`SELECT 1+1 as test`)[0].test),
      fileSystem: await fs.readdir(process.cwd()),
      settings: await fs.readFile(settingsPath, 'utf-8')
    }

    statusLogger.info('Sistema verificado correctamente', systemChecks)

    const stats = {
      status: 'active',
      database: dbStatus,
      fileSystem: {
        status: 'active',
        message: 'Sistema de archivos operativo'
      },
      thumbnails: {
        status: 'active',
        pending: imagesWithoutThumbnails,
        message: imagesWithoutThumbnails > 0
          ? `${imagesWithoutThumbnails} miniaturas pendientes`
          : 'Servicio de miniaturas listo'
      },
      settings: {
        status: 'active',
        message: 'Configuraciones cargadas correctamente'
      }
    }

    return NextResponse.json(serializeResponse(stats))
  } catch (error) {
    statusLogger.error('Error al obtener estado del sistema:', error)
    const dbStatus = await getDatabaseStatus()

    return NextResponse.json(serializeResponse({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      database: dbStatus,
      fileSystem: {
        status: 'error',
        message: 'Error en el sistema de archivos'
      },
      thumbnails: {
        status: 'error',
        message: 'Error en el servicio de miniaturas'
      },
      settings: {
        status: 'error',
        message: 'Error al cargar configuraciones'
      }
    }), { status: 500 })
  }
}