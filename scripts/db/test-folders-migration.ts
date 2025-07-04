/**
 * Script de prueba para validar la migración del endpoint GET /api/folders
 */

async function testFoldersEndpoint() {
	console.log('🧪 === PRUEBA DE MIGRACIÓN: GET /api/folders ===\n');

	try {
		console.log('📋 Probando endpoint GET /api/folders');

		const start = Date.now();
		const response = await fetch('http://localhost:5173/api/folders');
		const time = Date.now() - start;

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const folders = await response.json();

		console.log(`   ✅ Respuesta: ${time}ms`);
		console.log(`      - Total folders: ${folders.length}`);
		console.log(`      - Status: ${response.status}`);

		if (folders.length > 0) {
			const firstFolder = folders[0];
			console.log(`      - Primera carpeta: ${firstFolder.name} (${firstFolder.path})`);
			console.log(`      - Estructura: ${Object.keys(firstFolder).join(', ')}`);
		}
	} catch (error) {
		console.error('   ❌ Error:', error instanceof Error ? error.message : error);
	}

	console.log('\n🏁 Prueba completada');
}

// Ejecutar automáticamente
testFoldersEndpoint()
	.then(() => {
		console.log('✅ Script completado exitosamente');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error en el script:', error);
		process.exit(1);
	});
