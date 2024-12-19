import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Verificamos que estamos en el servidor
if (typeof window === 'undefined') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: [
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    })
  }
}

export const prisma = globalForPrisma.prisma
