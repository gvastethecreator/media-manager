// @ts-nocheck - Temporary suppression for Express handler parameter types
/**
 * Rutas API para el sistema avanzado de extracción de metadatos
 * Soporta detección completa de IA engines y metadatos técnicos
 */

import express from 'express';

const router = express.Router() as any;

// Log para verificar que el router se carga
console.log('🤖 Router metadata-advanced cargado correctamente');

/**
 * GET /api/metadata-advanced/test
 * Ruta de prueba para verificar que el router funciona
 */
router.get('/test', (_req, res) => {
	console.log('✅ Ruta /test ejecutándose');
	res.json({
		success: true,
		message: 'Router metadata-advanced funcionando correctamente',
		timestamp: new Date().toISOString(),
	});
});

/**
 * GET /api/metadata-advanced/simple-test
 * Otra ruta de prueba
 */
router.get('/simple-test', (req, res) => {
	console.log('✅ Ruta /simple-test ejecutándose');
	res.json({
		success: true,
		message: 'Ruta simple de prueba',
		path: req.path,
		originalUrl: req.originalUrl,
		method: req.method,
	});
});

/**
 * POST /api/metadata-advanced/extract-from-path
 * Extraer metadata de un archivo específico por su ruta
 */
router.post('/extract-from-path', async (req, res) => {
	try {
		const { filePath } = req.body;

		if (!filePath || typeof filePath !== 'string') {
			return res.status(400).json({
				error: 'Path del archivo requerido',
				message: 'Debe proporcionar un filePath válido en el body de la request',
			});
		}

		console.log(`🔍 Extrayendo metadata de: ${filePath}`);

		// Importar el servicio de metadata integration
		const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');

		// Leer el archivo como buffer
		const fs = await import('node:fs/promises');
		const fileBuffer = await fs.readFile(filePath);

		// Extraer metadata del archivo usando el servicio unificado
		const path = await import('node:path');
		const filename = path.basename(filePath);
		const metadata = await extractAllMetadata(fileBuffer, filename);

		console.log(`✅ Metadata extraída exitosamente de: ${filePath}`);

		res.json({
			success: true,
			filePath,
			metadata,
			extractedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('❌ Error al extraer metadata:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			filePath: req.body.filePath,
		});
	}
});

export default router;
