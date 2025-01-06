import { PrismaClient } from '@prisma/client'
import { logger } from './utils'

// Tipos para la configuración de la base de datos
interface DatabaseConfig {
  logLevel?: 'info' | 'warn' | 'error'
  connectionTimeout?: number
  maxConnections?: number
  retryAttempts?: number
  retryDelay?: number
}

// Configuración por defecto
const DEFAULT_CONFIG: Required<DatabaseConfig> = {
  logLevel: 'error',
  connectionTimeout: 10000,
  maxConnections: 10,
  retryAttempts: 3,
  retryDelay: 1000
}

declare global {
  var prisma: PrismaClient | undefined
}

class Database {
  private static instance: Database
  private client: PrismaClient
  private config: Required<DatabaseConfig>
  private isInitialized: boolean = false
  private connectionPromise?: Promise<void>

  private constructor(config: DatabaseConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Configurar cliente Prisma
    this.client = new PrismaClient({
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'query', emit: 'event' }
      ],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // Configurar eventos de logging
    this.client.$on('error', (e) => {
      logger.error('Error de base de datos:', e)
    })

    this.client.$on('warn', (e) => {
      logger.warn('Advertencia de base de datos:', e)
    })

    this.client.$on('info', (e) => {
      logger.info('Info de base de datos:', e)
    })

    this.client.$on('query', (e) => {
      logger.debug('Query ejecutada:', {
        query: e.query,
        params: e.params,
        duration: e.duration
      })
    })

    // Guardar instancia en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      global.prisma = this.client
    }
  }

  /**
   * Obtiene la instancia única de la base de datos
   */
  public static getInstance(config?: DatabaseConfig): Database {
    if (!Database.instance) {
      Database.instance = new Database(config)
    }
    return Database.instance
  }

  /**
   * Inicializa la conexión a la base de datos
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('La base de datos ya está inicializada')
      return
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.connect()
    return this.connectionPromise
  }

  /**
   * Establece la conexión con la base de datos
   */
  private async connect(): Promise<void> {
    let attempts = 0

    while (attempts < this.config.retryAttempts) {
      try {
        logger.info('Conectando a la base de datos...')

        // Intentar conectar
        await this.client.$connect()

        // Verificar conexión
        await this.client.folder.count()

        this.isInitialized = true
        logger.info('Conexión establecida correctamente')
        return
      } catch (error) {
        attempts++
        logger.error(`Error al conectar (intento ${attempts}/${this.config.retryAttempts}):`, {
          error: error instanceof Error ? error.message : error
        })

        if (attempts === this.config.retryAttempts) {
          throw new Error('No se pudo establecer conexión con la base de datos')
        }

        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
      }
    }
  }

  /**
   * Cierra la conexión con la base de datos
   */
  public async disconnect(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      await this.client.$disconnect()
      this.isInitialized = false
      logger.info('Conexión cerrada correctamente')
    } catch (error) {
      logger.error('Error al cerrar conexión:', error)
      throw error
    }
  }

  /**
   * Obtiene el cliente de Prisma
   */
  public getClient(): PrismaClient {
    if (!this.isInitialized) {
      throw new Error('La base de datos no está inicializada')
    }
    return this.client
  }

  /**
   * Verifica si la base de datos está conectada
   */
  public isConnected(): boolean {
    return this.isInitialized
  }
}

// Exportar instancia única
export const db = Database.getInstance()
export const prisma = db.getClient()

/**
 * Inicializa la base de datos con la configuración proporcionada
 */
export async function initializeDatabase(config?: DatabaseConfig): Promise<void> {
  try {
    await db.initialize()
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error)
    throw error
  }
}