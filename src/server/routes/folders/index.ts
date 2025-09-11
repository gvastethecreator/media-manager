/**
 * @file Router principal de Folders - Punto de entrada unificado
 * @module server/routes/folders
 * @description
 * Agrupa todos los endpoints de folders divididos por responsabilidad:
 * - CRUD: Operaciones básicas (crear, leer, actualizar, eliminar)
 * - Debug: Endpoints de debugging y análisis
 * - Sync: Sincronización con filesystem
 *
 * ✅ REFACTORIZADO - Septiembre 2025
 * 🎯 ARQUITECTURA LIMPIA - Separación de responsabilidades
 */

import { Router } from 'express';
import { serverLogger } from '@/lib/logger/server-logger';

import { crudRoutes } from './crud';
import { debugRoutes } from './debug';
import { syncRoutes } from './sync';

const router = Router();
const logger = serverLogger.withContext('FoldersRouter');

// Middleware de logging unificado
router.use((req, res, next) => {
	logger.debug('📁 Folders Router - Request received', {
		method: req.method,
		path: req.path,
		query: req.query,
	});
	next();
});

// Montar sub-routers
router.use('/', crudRoutes);
router.use('/_debug', debugRoutes);
router.use('/sync', syncRoutes);

export default router;
