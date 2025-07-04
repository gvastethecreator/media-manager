/**
 * Script de prueba para validar la migración de AlbumService
 */

import { getAlbum, getAlbums } from '@/services/album/album.service';

async function testAlbumServiceMigration() {
	console.log('🧪 === PRUEBA DE MIGRACIÓN: AlbumService ===\n');

	// Probar getAlbum
	console.log('📋 Probando getAlbum con ID inexistente');
	try {
		const start = Date.now();
		const result = await getAlbum('00000000-0000-0000-0000-000000000000');
		const time = Date.now() - start;
		console.log(`   ✅ getAlbum: ${time}ms - Resultado: ${result ? 'Encontrado' : 'null (esperado)'}`);
	} catch (error) {
		console.error('   ❌ Error getAlbum:', error instanceof Error ? error.message : error);
	}

	console.log('');

	// Probar getAlbums con diferentes filtros
	const testCases = [
		{ name: 'Sin filtros', options: {} },
		{ name: 'Con búsqueda', options: { search: 'test' } },
		{ name: 'Incluir archivados', options: { includeArchived: true } },
		{ name: 'Sin privados', options: { includePrivate: false } },
		{ name: 'Ordenado por fecha DESC', options: { orderBy: 'createdAt' as const, orderDirection: 'desc' as const } },
	];

	for (const testCase of testCases) {
		console.log(`📋 Probando getAlbums: ${testCase.name}`);
		console.log('   Opciones:', testCase.options);

		try {
			const start = Date.now();
			const result = await getAlbums(testCase.options);
			const time = Date.now() - start;

			console.log(`   ✅ Drizzle: ${time}ms`);
			console.log(`      - Total: ${result.total}`);
			console.log(`      - Albums: ${result.albums.length}`);

			if (result.albums.length > 0) {
				const firstAlbum = result.albums[0];
				console.log(`      - Primer álbum: ${firstAlbum.name} (${firstAlbum.category})`);
			}
		} catch (error) {
			console.error('   ❌ Error:', error instanceof Error ? error.message : error);
		}

		console.log('');
	}

	console.log('🏁 Prueba completada');
}

// Ejecutar automáticamente
testAlbumServiceMigration()
	.then(() => {
		console.log('✅ Script completado exitosamente');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error en el script:', error);
		process.exit(1);
	});
