import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export async function initializeDatabase() {
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()

    // Ejecutar una consulta simple para verificar que todo funciona
    await prisma.folder.count()

    console.log('🗄️ [Database] Conexión establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ [Database] Error al inicializar:', error)
    throw error
  }
}

export { prisma }