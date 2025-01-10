import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const prismaLogger = logger.withContext('PrismaClient')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  })

  // Logging
  client.$on('error', (e) => {
    prismaLogger.error('Prisma Error', e)
  })

  client.$on('warn', (e) => {
    prismaLogger.warn('Prisma Warning', e)
  })

  client.$on('info', (e) => {
    prismaLogger.info('Prisma Info', e)
  })

  client.$on('query', (e) => {
    prismaLogger.debug('Prisma Query', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    })
  })

  return client
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
