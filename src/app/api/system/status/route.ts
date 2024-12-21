import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect()

    // Verificar sistema de archivos
    const thumbnailsDir = path.join(process.cwd(), 'thumbnails')
    try {
      await fs.access(thumbnailsDir)
    } catch {
      await fs.mkdir(thumbnailsDir, { recursive: true })
    }

    // Verificar permisos de escritura en thumbnails
    try {
      const testFile = path.join(thumbnailsDir, '.test')
      await fs.writeFile(testFile, '')
      await fs.unlink(testFile)
    } catch (error) {
      throw new Error('No hay permisos de escritura en el directorio de miniaturas')
    }

    // Verificar settings.json
    const settingsPath = path.join(process.cwd(), 'settings.json')
    try {
      await fs.access(settingsPath)
    } catch {
      throw new Error('No se encontró el archivo de configuración')
    }

    // Obtener estadísticas de miniaturas
    const imagesWithoutThumbnails = await prisma.image.count({
      where: { thumbnail: null }
    })

    // Verificar estado del sistema
    const systemChecks = {
      database: await prisma.$queryRaw`SELECT 1+1 as test`,
      fileSystem: await fs.readdir(process.cwd()),
      settings: await fs.readFile(settingsPath, 'utf-8')
    }

    const stats = {
      status: 'active',
      database: {
        status: 'connected',
        message: 'Base de datos conectada y funcionando'
      },
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

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al obtener estado del sistema:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      database: {
        status: 'error',
        message: 'Error al conectar con la base de datos'
      },
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
    }, { status: 500 })
  }
}