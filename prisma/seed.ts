import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger/logger'
import { seedCardConfigurations } from './seeds/card-configurations.seed'
import { seedProfiles } from './seeds/profile.seed'
import { seedFolders } from './seeds/folder.seed'
import { seedAlbums } from './seeds/album.seed'
import { seedCollections } from './seeds/collection.seed'
import { seedTags } from './seeds/tag.seed'
import { seedWorldEntities } from './seeds/world-entities.seed'
import { seedConcepts } from './seeds/concept.seed'
import { seedPrompts } from './seeds/prompt.seed'
import { seedNotes } from './seeds/note.seed'
import { seedRarities } from './seeds/rarity.seed'
import { seedTextures } from './seeds/texture.seed'
import { safeDeleteMany, seedLogger } from './seeds/utils.seed'

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

async function main() {
  seedLogger.info('🌱 Iniciando proceso de seed...')

  // Limpiar la base de datos de forma segura
  seedLogger.info('🧹 Limpiando base de datos...')

  // Lista de modelos y sus tablas correspondientes
  const modelsToClean = [
    { model: 'profile', table: 'Profile' },
    { model: 'folder', table: 'Folder' },
    { model: 'collection', table: 'Collection' },
    { model: 'tag', table: 'Tag' },
    { model: 'album', table: 'Album' },
    { model: 'worldItem', table: 'WorldItem' },
    { model: 'place', table: 'Place' },
    { model: 'character', table: 'Character' },
    { model: 'concept', table: 'Concept' },
    { model: 'prompt', table: 'Prompt' },
    { model: 'note', table: 'Note' },
    { model: 'uploadedImage', table: 'UploadedImage' },
    { model: 'cardConfiguration', table: 'card_configurations' },
    { model: 'rarity', table: 'Rarity' },
    { model: 'texture', table: 'Texture' }
  ]

  // Eliminar registros de cada tabla de forma segura
  for (const { model, table } of modelsToClean) {
    await safeDeleteMany(prisma, model, table)
  }

  try {
    // Sembrar perfiles
    await seedProfiles(prisma)

    // Sembrar las configuraciones de tarjetas
    await seedCardConfigurations(prisma)

    // Sembrar carpetas
    await seedFolders(prisma)

    // Sembrar álbumes
    await seedAlbums(prisma)

    // Sembrar colecciones
    await seedCollections(prisma)

    // Sembrar tags
    await seedTags(prisma)

    // Sembrar entidades del mundo (worldItem, place, character)
    await seedWorldEntities(prisma)

    // Sembrar conceptos
    await seedConcepts(prisma)

    // Sembrar prompts
    await seedPrompts(prisma)

    // Sembrar notas
    await seedNotes(prisma)

    // Sembrar rarezas
    await seedRarities(prisma)

    // Sembrar texturas
    await seedTextures(prisma)

    seedLogger.info('✅ Proceso de seed completado con éxito')
  } catch (error) {
    seedLogger.error('❌ Error durante el proceso de seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    seedLogger.error('❌ Error durante el proceso de seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
