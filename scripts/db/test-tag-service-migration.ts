/**
 * Script de prueba para validar la migración de TagService
 */

import { getTag, getTags } from '@/services/tag/tag.service';

async function testTagServiceMigration() {
  console.log('🧪 === PRUEBA DE MIGRACIÓN: TagService ===\n');

  // Probar getTag
  console.log('📋 Probando getTag con ID inexistente');
  try {
    const start = Date.now();
    const result = await getTag('00000000-0000-0000-0000-000000000000');
    const time = Date.now() - start;
    console.log(`   ✅ getTag: ${time}ms - Resultado: ${result ? 'Encontrado' : 'null (esperado)'}`);
  } catch (error) {
    console.error('   ❌ Error getTag:', error instanceof Error ? error.message : error);
  }

  console.log('');

  // Probar getTags con diferentes filtros
  const testCases = [
    { name: 'Sin filtros', options: {} },
    { name: 'Con búsqueda', options: { search: 'test' } },
    { name: 'Solo favoritos', options: { onlyFavorites: true } },
    { name: 'Sin archivados', options: { includeArchived: false } },
    { name: 'Ordenado por fecha DESC', options: { orderBy: 'createdAt' as const, orderDirection: 'desc' as const } },
  ];

  for (const testCase of testCases) {
    console.log(`📋 Probando getTags: ${testCase.name}`);
    console.log('   Opciones:', testCase.options);

    try {
      const start = Date.now();
      const result = await getTags(testCase.options);
      const time = Date.now() - start;

      console.log(`   ✅ Drizzle: ${time}ms`);
      console.log(`      - Total: ${result.total}`);
      console.log(`      - Tags: ${result.tags.length}`);

      if (result.tags.length > 0) {
        const firstTag = result.tags[0];
        console.log(`      - Primer tag: ${firstTag.name} (${firstTag.color || 'sin color'})`);
      }

    } catch (error) {
      console.error('   ❌ Error:', error instanceof Error ? error.message : error);
    }

    console.log('');
  }

  console.log('🏁 Prueba completada');
}

// Ejecutar automáticamente
testTagServiceMigration()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });