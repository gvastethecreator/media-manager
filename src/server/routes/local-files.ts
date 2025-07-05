/**
 * @file Router para servir archivos locales
 * @module server/routes/local-files
 *
 * ❌ TEMPORALMENTE DESHABILITADO - 2025-07-04
 *
 * Este router está deshabilitado debido a conflictos con path-to-regexp
 * en Express 5 cuando se usan patrones wildcard como '/*'.
 *
 * TODO: Refactorizar para usar rutas específicas compatibles con Express 5
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/local-files/health - Health check del módulo
 */
router.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		module: 'local-files',
		message: 'Módulo deshabilitado temporalmente',
		timestamp: new Date().toISOString(),
	});
});

/**
 * Todas las rutas de archivos locales están temporalmente deshabilitadas
 * debido a incompatibilidad con Express 5 y path-to-regexp.
 *
 * Rutas que necesitan ser refactorizadas:
 * - GET /* (servir archivos con wildcard)
 * - Manejo de paths dinámicos
 * - Validación de seguridad de rutas
 */

export default router;
