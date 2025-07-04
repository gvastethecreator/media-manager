import express from 'express';
import path from 'path';

const router = express.Router();

const BASE_DIRECTORY = path.resolve('/allowed/base/directory');

/**
 * Archivo temporalmente simplificado
 * TODO: Implementar rutas cuando se resuelvan los problemas de path-to-regexp
 */

// Ruta básica para health check
router.get('/health', async (_req, res) => {
	res.json({
		status: 'ok',
		service: 'local-files',
		timestamp: new Date().toISOString()
	});
});

export default router;
