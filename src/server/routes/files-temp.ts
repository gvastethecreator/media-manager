/**
 * @file Rutas de API para operaciones con archivos (TEMPORAL)
 * @module server/routes/files
 * ✅ VERSIÓN CORREGIDA TEMPORAL - 2025-07-04
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/files/health - Health check para el módulo de archivos
 */
router.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		module: 'files',
		timestamp: new Date().toISOString()
	});
});

/**
 * GET /api/files/test - Test básico
 */
router.get('/test', (_req, res) => {
	res.json({
		message: 'Files API funcionando correctamente',
		timestamp: new Date().toISOString()
	});
});

// TODO: Implementar rutas de archivos sin usar patrones /* problemáticos
// Las rutas originales causaban errores en path-to-regexp
// Necesitamos implementar rutas específicas para cada operación

export default router;
