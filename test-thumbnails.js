/**
 * 🧪 Script de prueba para el sistema de thumbnails optimizado
 * Verifica cache en disco, memoria y métricas
 */

import { thumbsConfig } from './src/config/thumbs';
import { 
	generateContentHash, 
	getCacheStats,
	initializeDiskCache 
} from './src/services/cache/disk-cache.service';
import { thumbnailMemoryCache } from './src/services/cache/memory-cache.service';

async function testThumbnailSystem() {
	console.log('🚀 Iniciando prueba del sistema de thumbnails optimizado...\n');

	// 1. Configuración
	console.log('📋 Configuración actual:');
	console.log(`  Provider: ${thumbsConfig.provider}`);
	console.log(`  Root Dir: ${thumbsConfig.rootDir}`);
	console.log(`  Concurrency: ${thumbsConfig.concurrency}`);
	console.log(`  Memory Max: ${thumbsConfig.memory.maxEntries}`);
	console.log(`  Sizes: ${JSON.stringify(thumbsConfig.sizes)}\n`);

	// 2. Inicializar cache en disco
	console.log('💾 Inicializando cache en disco...');
	try {
		await initializeDiskCache();
		console.log('✅ Cache en disco inicializado\n');
	} catch (error) {
		console.error('❌ Error inicializando cache:', error);
		return;
	}

	// 3. Probar generación de hash
	console.log('🔑 Probando generación de hash...');
	const testPath = '/test/image.jpg';
	const hash1 = await generateContentHash(testPath + 'medium');
	const hash2 = await generateContentHash(testPath + 'medium');
	console.log(`  Hash 1: ${hash1}`);
	console.log(`  Hash 2: ${hash2}`);
	console.log(`  Iguales: ${hash1 === hash2 ? '✅' : '❌'}\n`);

	// 4. Probar cache en memoria
	console.log('🧠 Probando cache en memoria...');
	const testBuffer = Buffer.from('test image data');
	const testHash = await generateContentHash('test-image');
	
	// Guardar en memoria
	const saved = thumbnailMemoryCache.set(testHash, 'medium', testBuffer, {
		width: 256,
		height: 256,
		format: 'webp'
	});
	console.log(`  Guardado en memoria: ${saved ? '✅' : '❌'}`);

	// Leer desde memoria
	const cached = thumbnailMemoryCache.get(testHash, 'medium');
	console.log(`  Recuperado desde memoria: ${cached ? '✅' : '❌'}`);
	console.log(`  Tamaño del buffer: ${cached?.buffer.length || 0} bytes\n`);

	// 5. Estadísticas de cache en memoria
	console.log('📊 Estadísticas de cache en memoria:');
	const memStats = thumbnailMemoryCache.getStats();
	console.log(`  Entradas: ${memStats.itemCount}/${memStats.maxSize}`);
	console.log(`  Hit Rate: ${(memStats.hitRate * 100).toFixed(1)}%`);
	console.log(`  Miss Rate: ${(memStats.missRate * 100).toFixed(1)}%`);
	console.log(`  Memoria usada: ${(memStats.memoryUsage / 1024).toFixed(1)} KB\n`);

	// 6. Estadísticas de cache en disco
	console.log('💾 Estadísticas de cache en disco:');
	try {
		const diskStats = await getCacheStats();
		console.log(`  Archivos: ${diskStats.totalFiles}`);
		console.log(`  Tamaño total: ${(diskStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
		console.log(`  Archivo más antiguo: ${diskStats.oldestFile?.toISOString() || 'N/A'}`);
		console.log(`  Archivo más nuevo: ${diskStats.newestFile?.toISOString() || 'N/A'}\n`);
	} catch (error) {
		console.log('  Error obteniendo estadísticas de disco:', error);
	}

	// 7. Optimización automática
	console.log('🔧 Probando optimización automática...');
	const optimization = thumbnailMemoryCache.optimize();
	console.log(`  Entradas eliminadas: ${optimization.evicted}`);
	console.log(`  Razón: ${optimization.reason}\n`);

	// 8. Reporte final
	console.log('📋 Reporte final:');
	thumbnailMemoryCache.printReport();
	
	console.log('\n✅ Prueba completada exitosamente!');
}

// Ejecutar prueba
testThumbnailSystem().catch(console.error);