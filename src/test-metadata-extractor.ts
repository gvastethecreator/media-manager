/**
 * Script de prueba para validar las correcciones del extractor de metadatos
 */

import {
	clearMetadataCache,
	extractMetadata,
	preloadMetadata,
} from './app/actions/metadata/metadata-extractors.actions';
import { logger } from './lib/logger';

const testLogger = logger.withContext('TestMetadataExtractor');

/**
 * Función principal para probar el extractor de metadatos
 */
async function testMetadataExtractor() {
	testLogger.info('🧪 Iniciando pruebas del extractor de metadatos...');

	// Limpiar caché para empezar con un estado limpio
	await clearMetadataCache();
	testLogger.info('🧹 Caché de metadatos limpiado');

	// Prueba 1: Extraer metadatos con rutas inconsistentes
	testLogger.info('🔍 Prueba 1: Extraer metadatos con rutas inconsistentes');
	const rutas = [
		'G:\\#outputs\\sdmatrix\\2024-08-29\\test.png',
		'G:\\#outpuuts\\sdmatrix\\2024-08-29\\test.png',
		'G:\\#outpputs\\sdmatrix\\2024-08-29\\test.png',
		'G:\\#outputs\\ssdmatrix\\2024-08-29\\test.png',
	];

	try {
		// Crear una ruta de prueba real que exista en el sistema
		const rutaReal = 'D:\\DEV\\image-manager\\public\\placeholder.png';

		// Extraer metadatos de la ruta real
		testLogger.info(`📄 Extrayendo metadatos de: ${rutaReal}`);
		const metadata = await extractMetadata(rutaReal);
		testLogger.info('✅ Metadatos extraídos exitosamente:', metadata);

		// Probar normalización de rutas
		testLogger.info('🔄 Probando normalización de rutas...');
		for (const ruta of rutas) {
			testLogger.info(`🔍 Probando normalización para: ${ruta}`);
			// Esta prueba fallará al intentar leer archivos que no existen,
			// pero nos permitirá ver la normalización en acción en los logs
			try {
				await extractMetadata(ruta);
			} catch (error) {
				testLogger.info(
					'Error esperado al intentar acceder a una ruta que no existe:',
					error instanceof Error ? error.message : String(error)
				);
			}
		}

		// Prueba de caché: extraer metadatos dos veces de la misma ruta
		testLogger.info('🔄 Probando caché: extrayendo metadatos dos veces de la misma ruta');
		const primerIntento = await extractMetadata(rutaReal);
		testLogger.info('✅ Primer intento completado');

		const segundoIntento = await extractMetadata(rutaReal);
		testLogger.info('✅ Segundo intento completado (debería venir de caché)');

		// Verificar si los metadatos son iguales
		const sonIguales = JSON.stringify(primerIntento) === JSON.stringify(segundoIntento);
		testLogger.info(`🔍 Metadatos iguales: ${sonIguales}`);
	} catch (error) {
		testLogger.error('❌ Error durante las pruebas:', error instanceof Error ? error.message : String(error));
	}

	testLogger.info('✅ Pruebas completadas');
}

// Ejecutar las pruebas
testMetadataExtractor()
	.then(() => {
		testLogger.info('👋 Script finalizado con éxito');
		process.exit(0);
	})
	.catch((error) => {
		testLogger.error('💥 Error fatal:', error);
		process.exit(1);
	});
