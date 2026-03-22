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

/**
 * Helper para crear un error tipado en catch de Effect.tryPromise
 */
function toError(context: string, error: unknown): Error {
	serverLogger.error(`${context}:`, error);
	return new Error(`${context}: ${error instanceof Error ? error.message : String(error)}`);
}

// GET /api/system/navigation - Obtener datos de navegación
router.get(
	'/navigation',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getNavigationData(),
			catch: (error) => toError('Error al obtener datos de navegación', error),
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
				health: reindexMonitor.getSystemHealth(),
				operations: reindexMonitor.getOperationsMetrics(),
				circuitBreakers: circuitBreakerRegistry.getStats(),
			}),
			catch: (error) => toError('Error en health check', error),
		})
	)
);

// GET /api/system/stats - Obtener estadísticas del sistema
router.get(
	'/stats',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getSystemStats(),
			catch: (error) => toError('Error obteniendo estadísticas del sistema', error),
		})
	)
);

// POST /api/system/repair - Reparar el sistema
router.post(
	'/repair',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => repairSystem(),
			catch: (error) => toError('Error reparando el sistema', error),
		})
	)
);

// POST /api/system/reset-db - Resetear la base de datos
router.post(
	'/reset-db',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => resetDatabase(),
			catch: (error) => toError('Error reseteando la base de datos', error),
		})
	)
);

// GET /api/system/version - Obtener versión del sistema
router.get(
	'/version',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getSystemVersion(),
			catch: (error) => toError('Error obteniendo versión del sistema', error),
		})
	)
);

// GET /api/system/settings - Obtener configuración global del sistema
router.get(
	'/settings',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getSystemSettings(),
			catch: (error) => toError('Error obteniendo configuración del sistema', error),
		})
	)
);

// PUT /api/system/settings - Actualizar configuración global del sistema
router.put(
	'/settings',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => updateSystemSettings(req.body),
			catch: (error) => toError('Error actualizando configuración del sistema', error),
		})
	)
);

// POST /api/system/settings/reset - Resetear configuración global del sistema
router.post(
	'/settings/reset',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => resetSystemSettings(),
			catch: (error) => toError('Error reseteando configuración del sistema', error),
		})
	)
);

// GET /api/system/profiles/:profileId/settings - Obtener configuración de un perfil específico
router.get(
	'/profiles/:profileId/settings',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => getProfileSettings(req.params.profileId),
			catch: (error) => toError(`Error obteniendo configuración del perfil ${req.params.profileId}`, error),
		})
	)
);

// PUT /api/system/profiles/:profileId/settings - Actualizar configuración de un perfil específico
router.put(
	'/profiles/:profileId/settings',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => updateProfileSettings(req.params.profileId, req.body),
			catch: (error) => toError(`Error actualizando configuración del perfil ${req.params.profileId}`, error),
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
			catch: (error) => toError(`Error reseteando configuración del perfil ${req.params.profileId}`, error),
		})
	)
);

// POST /api/system/settings/default - Crear datos de configuración por defecto
router.post(
	'/settings/default',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => createDefaultSettingsData(),
			catch: (error) => toError('Error creando configuración por defecto', error),
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
			catch: (error) => toError('Error reseteando sistema de reindexado', error),
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
			catch: (error) => toError('Error cancelando operaciones', error),
		})
	)
);

// Endpoint de diagnóstico DB (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
	router.get(
		'/dbinfo',
		effectHandler((_req, _res) =>
			Effect.tryPromise({
				try: () => getDatabaseInfo(),
				catch: (error) => toError('Error obteniendo información de la base de datos', error),
			})
		)
	);
}

export default router;
