import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear carpeta de prueba
  const testFolder = await prisma.folder.create({
    data: {
      name: 'Test Folder',
      path: 'D:\\DEV\\image-manager\\test-folder',
      isWatched: false,
      totalFiles: 0,
      totalSize: 0
    }
  })

  console.log('Carpeta de prueba creada:', testFolder)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })