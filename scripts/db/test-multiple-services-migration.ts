/**
 * Script de prueba masiva para validar múltiples migraciones de servicios
 */

import { getAlbum, getAlbums } from '@/services/album/album.service';
import { ConceptService } from '@/services/concept/concept.service';
import { getTag, getTags } from '@/services/tag/tag.service';

async function testMultipleServicesMigration() {
  console.log('🧪 === PRUEBA MASIVA DE MIGRACIONES ===\n');

  // === TAGSERVICE ===
  console.log('🏷️ === TagService ===');
  try {
    const start = Date.now();
    const tagsResult = await getTags({ search: 'test', orderBy: 'createdAt', orderDirection: 'desc' });
    const time = Date.now() - start;
    console.log(`   ✅ getTags: ${time}ms - Total: ${tagsResult.total}, Tags: ${tagsResult.tags.length}`);
  } catch (error) {
    console.error('   ❌ Error TagService:', error instanceof Error ? error.message : error);
  }

  // === ALBUMSERVICE ===
  console.log('🎞️ === AlbumService ===');
  try {
    const start = Date.now();
    const albumsResult = await getAlbums({ search: 'test', orderBy: 'name', orderDirection: 'asc' });
    const time = Date.now() - start;
    console.log(`   ✅ getAlbums: ${time}ms - Total: ${albumsResult.total}, Albums: ${albumsResult.albums.length}`);
  } catch (error) {
    console.error('   ❌ Error AlbumService:', error instanceof Error ? error.message : error);
  }

  // === CONCEPTSERVICE ===
  console.log('💡 === ConceptService ===');
  try {
    const start = Date.now();
    const conceptsResult = await ConceptService.getConcepts({
      search: 'test',
      sortBy: 'name',
      sortOrder: 'asc',
      pageSize: 10
    });
    const time = Date.now() - start;
    console.log(`   ✅ getConcepts: ${time}ms - Total: ${conceptsResult.total}, Concepts: ${conceptsResult.items.length}`);
  } catch (error) {
    console.error('   ❌ Error ConceptService:', error instanceof Error ? error.message : error);
  }

  console.log('');

  // === PRUEBAS INDIVIDUALES RÁPIDAS ===
  console.log('🔍 === Pruebas individuales (getById) ===');

  const testId = '00000000-0000-0000-0000-000000000000';

  // Parallel testing
  const [tagResult, albumResult, conceptResult] = await Promise.allSettled([
    getTag(testId),
    getAlbum(testId),
    ConceptService.getConcept(testId)
  ]);

  console.log(`   Tag getById: ${tagResult.status === 'fulfilled' ? '✅' : '❌'} - ${tagResult.status === 'fulfilled' ? (tagResult.value ? 'Found' : 'null (esperado)') : 'Error'}`);
  console.log(`   Album getById: ${albumResult.status === 'fulfilled' ? '✅' : '❌'} - ${albumResult.status === 'fulfilled' ? (albumResult.value ? 'Found' : 'null (esperado)') : 'Error'}`);
  console.log(`   Concept getById: ${conceptResult.status === 'fulfilled' ? '✅' : '❌'} - ${conceptResult.status === 'fulfilled' ? (conceptResult.value ? 'Found' : 'null (esperado)') : 'Error'}`);

  console.log('\n🏁 Prueba masiva completada');
  console.log('\n📊 === RESUMEN DE SERVICIOS MIGRADOS ===');
  console.log('✅ ProfileService (3/3 métodos)');
  console.log('✅ ImageService (1/? métodos - getImages)');
  console.log('✅ FolderService (1/? endpoints - GET /api/folders)');
  console.log('✅ TagService (2/? métodos - getTag, getTags)');
  console.log('✅ AlbumService (2/? métodos - getAlbum, getAlbums)');
  console.log('✅ ConceptService (2/? métodos - getConcept, getConcepts)');
  console.log('\n🎯 Total: 6 servicios migrados parcial o completamente');
}

// Ejecutar automáticamente
testMultipleServicesMigration()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });