/**
 * Script de prueba para validar la migración de ImageService.getImages()
 */

import { imageService } from '@/services/image/image.service';

async function testImageServiceMigration() {
  console.log('🧪 === PRUEBA DE MIGRACIÓN: ImageService.getImages() ===\n');

  const testCases = [
    { name: 'Sin filtros (página 1)', options: {} },
    { name: 'Con búsqueda', options: { search: 'test' } },
    { name: 'Solo favoritos', options: { isFavorite: true } },
    { name: 'Ordenado por nombre ASC', options: { sortBy: 'name', sortOrder: 'asc' as const } },
    { name: 'Página 2 con 10 elementos', options: { page: 2, pageSize: 10 } },
  ];

  for (const testCase of testCases) {
    console.log(`📋 Probando: ${testCase.name}`);
    console.log('   Opciones:', testCase.options);

    try {
      const start = Date.now();
      const result = await imageService.getImages(testCase.options);
      const time = Date.now() - start;

      console.log(`   ✅ Drizzle: ${time}ms`);
      console.log(`      - Total: ${result.pagination.total}`);
      console.log(`      - Imágenes: ${result.images.length}`);
      console.log(`      - Página: ${result.pagination.page}/${result.pagination.totalPages}`);

      if (result.images.length > 0) {
        const firstImage = result.images[0];
        console.log(`      - Primera imagen: ${firstImage.name} (${firstImage.folder?.name || 'Sin carpeta'})`);
      }

    } catch (error) {
      console.error('   ❌ Error:', error instanceof Error ? error.message : error);
    }

    console.log('');
  }

  console.log('🏁 Prueba completada');
}

// Ejecutar automáticamente
testImageServiceMigration()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });