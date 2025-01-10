import { Prisma } from '@prisma/client'
import { logger } from './logger'

const errorLogger = logger.withContext('ErrorHandler')

export class StatsError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'StatsError'
  }
}

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Errores conocidos de Prisma
    switch (error.code) {
      case 'P2002':
        throw new StatsError('Error de unicidad en la base de datos', error)
      case 'P2025':
        throw new StatsError('Registro no encontrado', error)
      default:
        throw new StatsError(
          `Error de base de datos (${error.code}): ${error.message}`,
          error
        )
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    throw new StatsError('Error de validación en la base de datos', error)
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new StatsError('Error al inicializar la base de datos', error)
  } else if (error instanceof Error) {
    throw new StatsError(error.message, error)
  } else {
    throw new StatsError('Error desconocido en el servicio de estadísticas', error)
  }
}
