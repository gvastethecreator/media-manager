import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Verificando conexión a la base de datos...')

    // Intentar una consulta simple
    const result = await prisma.$queryRaw`SELECT 1+1 as test`
    console.log('✅ Conexión exitosa:', result)

    // Verificar tablas
    const profile = await prisma.profile.findFirst()
    console.log('📊 Primer perfil:', profile)

  } catch (error) {
    console.error('❌ Error al conectar:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()