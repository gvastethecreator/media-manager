import { Effect } from 'effect';
import express from 'express';
import { getDatabaseInfo } from '@/lib/drizzle';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import { circuitBreakerRegistry } from '@/lib/system/circuit-breaker';
import { reindexMonitor } from '@/lib/system/reindex-monitor';
import { getSystemStats } from '../services/stats.service';
import { getNavigationData } from '../services/system';
import {
	createDefaultSettingsData,
	getProfileSettings,
	getSystemSettings,
	getSystemVersion,
	repairSystem,
	resetDatabase,
	resetProfileSettings,
	resetSystemSettings,
	updateProfileSettings,
	updateSystemSettings,
} from '../services/system.service';

const router = express.Router();

// GET /api/system/navigation - Obtener datos de navegación
router.get(
	'/navigation',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: async () => {
				serverLogger.debug('🧭 [SystemRouter] Iniciando obtención de datos de navegación');
				serverLogger.debug('🔍 [DEBUG] Petición recibida en /api/system/navigation');
				const navigationData = await getNavigationData();
				serverLogger.debug('✅ [SystemRouter] Datos de navegación obtenidos exitosamente');
				serverLogger.debug('📊 [DEBUG] Folders encontradas:', navigationData.folders.length);
				return navigationData;
			},
			catch: (error) => {
				serverLogger.error('❌ [SystemRouter] Error al obtener datos de navegación:', error);
				return error;
			},
		})
	)
);

// GET /api/system/health - Health check del sistema
router.get(
	'/health',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: async () => ({
				status: 'ok',
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
				memory: process.memoryUsage(),
				version: process.version,
			}),
			catch: (error) => {
				serverLogger.error('Error en health check:', error);
				return error;
			},
		})
	)
);

// GET /api/system/stats - Obtener estadísticas del sistema corregidas
router.get(
	'/stats',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: async () => {
				serverLogger.debug('🎯 [SYSTEM] Usando getSystemStats de stats.service.ts');
				return await getSystemStats();
			},
			catch: (error) => {
				serverLogger.error('Error obteniendo estadísticas del sistema:', error);
				return error;
			},
		})
	)
);

// POST /api/system/repair - Reparar el sistema
router.post(
	'/repair',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => repairSystem(),
			catch: (error) => {
				serverLogger.error('Error reparando el sistema:', error);
				return error;
			},
		})
	)
);

// POST /api/system/reset-db - Resetear la base de datos
router.post(
	'/reset-db',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => resetDatabase(),
			catch: (error) => {
				serverLogger.error('Error reseteando la base de datos:', error);
				return error;
			},
		})
	)
);

// GET /api/system/version - Obtener versión del sistema
router.get(
	'/version',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getSystemVersion(),
			catch: (error) => {
				serverLogger.error('Error obteniendo versión del sistema:', error);
				return error;
			},
		})
	)
);

// GET /api/system/settings - Obtener configuración global del sistema
router.get(
	'/settings',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getSystemSettings(),
			catch: (error) => {
				serverLogger.error('Error obteniendo configuración del sistema:', error);
				return error;
			},
		})
	)
);

// PUT /api/system/settings - Actualizar configuración global del sistema
router.put(
	'/settings',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => updateSystemSettings(req.body),
			catch: (error) => {
				serverLogger.error('Error actualizando configuración del sistema:', error);
				return error;
			},
		})
	)
);

// POST /api/system/settings/reset - Resetear configuración global del sistema
router.post(
	'/settings/reset',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => resetSystemSettings(),
			catch: (error) => {
				serverLogger.error('Error reseteando configuración del sistema:', error);
				return error;
			},
		})
	)
);

// GET /api/system/profiles/:profileId/settings - Obtener configuración de un perfil específico
router.get(
	'/profiles/:profileId/settings',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => getProfileSettings(req.params.profileId),
			catch: (error) => {
				serverLogger.error(`Error obteniendo configuración del perfil ${req.params.profileId}:`, error);
				return error;
			},
		})
	)
);

// PUT /api/system/profiles/:profileId/settings - Actualizar configuración de un perfil específico
router.put(
	'/profiles/:profileId/settings',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => updateProfileSettings(req.params.profileId, req.body),
			catch: (error) => {
				serverLogger.error(`Error actualizando configuración del perfil ${req.params.profileId}:`, error);
				return error;
			},
		})
	)
);

// POST /api/system/profiles/:profileId/settings/reset - Resetear configuración de un perfil
router.post(
	'/profiles/:profileId/settings/reset',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: async () => {
				await resetProfileSettings(req.params.profileId);
				return { success: true, message: 'Configuración del perfil reseteada' };
			},
			catch: (error) => {
				serverLogger.error(`Error reseteando configuración del perfil ${req.params.profileId}:`, error);
				return error;
			},
		})
	)
);

// POST /api/system/settings/default - Crear datos de configuración por defecto
router.post(
	'/settings/default',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => createDefaultSettingsData(),
			catch: (error) => {
				serverLogger.error('Error creando configuración por defecto:', error);
				return error;
			},
		})
	)
);

// GET /api/system/health - Estado general del sistema de reindexado
router.get(
	'/health',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: async () => ({
				status: 'ok',
				timestamp: Date.now(),
				health: reindexMonitor.getSystemHealth(),
				operations: reindexMonitor.getOperationsMetrics(),
				circuitBreakers: circuitBreakerRegistry.getStats(),
			}),
			catch: (error) => {
				serverLogger.error('Error obteniendo health del sistema:', error);
				return error;
			},
		})
	)
);

// POST /api/system/reindex/reset - Reset del sistema de reindexado
router.post(
	'/reindex/reset',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: async () => {
				reindexMonitor.reset();
				circuitBreakerRegistry.resetAll();
				return {
					message: 'Sistema de reindexado reseteado correctamente',
					timestamp: Date.now(),
				};
			},
			catch: (error) => {
				serverLogger.error('Error reseteando sistema:', error);
				return error;
			},
		})
	)
);

// POST /api/system/reindex/cancel - Cancelar operaciones activas
router.post(
	'/reindex/cancel',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: async () => {
				reindexMonitor.cancelAllActiveOperations();
				return {
					message: 'Operaciones activas canceladas',
					timestamp: Date.now(),
				};
			},
			catch: (error) => {
				serverLogger.error('Error cancelando operaciones:', error);
				return error;
			},
		})
	)
);

// ENDPOINT TEMPORAL PARA DEBUG DE BASE DE DATOS
router.get(
	'/dbinfo',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getDatabaseInfo(),
			catch: (error) => {
				serverLogger.error('Error obteniendo información de la base de datos:', error);
				return error;
			},
		})
	)
);

export default router;
