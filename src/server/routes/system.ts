import express from 'express';
import { getDatabaseInfo } from '@/lib/drizzle';
import { circuitBreakerRegistry } from '@/lib/system/circuit-breaker';
import { reindexMonitor } from '@/lib/system/reindex-monitor';
import { getSystemStats } from '../services/stats.service';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	createDefaultSettingsData,
	getNavigationData,
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
router.get('/navigation', async (_req, res) => {
	try {
		serverLogger.debug('🧭 [SystemRouter] Iniciando obtención de datos de navegación');
		serverLogger.debug('🔍 [DEBUG] Petición recibida en /api/system/navigation');
		const navigationData = await getNavigationData();
		serverLogger.debug('✅ [SystemRouter] Datos de navegación obtenidos exitosamente');
		serverLogger.debug('📊 [DEBUG] Folders encontradas:', navigationData.folders.length);
		res.json(navigationData);
	} catch (error) {
		serverLogger.error('❌ [SystemRouter] Error al obtener datos de navegación:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/system/health - Health check del sistema
router.get('/health', async (_req, res) => {
	try {
		res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			version: process.version,
		});
	} catch (error) {
		serverLogger.error('Error en health check:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'Error en health check',
		});
	}
});

// GET /api/system/stats - Obtener estadísticas del sistema corregidas
router.get('/stats', async (_req, res) => {
	try {
		serverLogger.debug('🎯 [SYSTEM] Usando getSystemStats de stats.service.ts');
		const stats = await getSystemStats();
		res.json(stats);
	} catch (error) {
		serverLogger.error('Error obteniendo estadísticas del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudieron obtener las estadísticas del sistema',
		});
	}
});

// POST /api/system/repair - Reparar el sistema
router.post('/repair', async (_req, res) => {
	try {
		const result = await repairSystem();
		res.json(result);
	} catch (error) {
		serverLogger.error('Error reparando el sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo reparar el sistema',
		});
	}
});

// POST /api/system/reset-db - Resetear la base de datos
router.post('/reset-db', async (_req, res) => {
	try {
		const result = await resetDatabase();
		res.json(result);
	} catch (error) {
		serverLogger.error('Error reseteando la base de datos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo resetear la base de datos',
		});
	}
});

// GET /api/system/version - Obtener versión del sistema
router.get('/version', async (_req, res) => {
	try {
		const version = await getSystemVersion();
		res.json(version);
	} catch (error) {
		serverLogger.error('Error obteniendo versión del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo obtener la versión del sistema',
		});
	}
});

// GET /api/system/settings - Obtener configuración global del sistema
router.get('/settings', async (_req, res) => {
	try {
		const settings = await getSystemSettings();
		res.json(settings);
	} catch (error) {
		serverLogger.error('Error obteniendo configuración del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo obtener la configuración del sistema',
		});
	}
});

// PUT /api/system/settings - Actualizar configuración global del sistema
router.put('/settings', async (req, res) => {
	try {
		const updatedSettings = await updateSystemSettings(req.body);
		res.json(updatedSettings);
	} catch (error) {
		serverLogger.error('Error actualizando configuración del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo actualizar la configuración del sistema',
		});
	}
});

// POST /api/system/settings/reset - Resetear configuración global del sistema
router.post('/settings/reset', async (_req, res) => {
	try {
		const resetSettings = await resetSystemSettings();
		res.json(resetSettings);
	} catch (error) {
		serverLogger.error('Error reseteando configuración del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo resetear la configuración del sistema',
		});
	}
});

// GET /api/system/profiles/:profileId/settings - Obtener configuración de un perfil específico
router.get('/profiles/:profileId/settings', async (req, res) => {
	try {
		const { profileId } = req.params;
		const settings = await getProfileSettings(profileId);
		res.json(settings);
	} catch (error) {
		serverLogger.error(`Error obteniendo configuración del perfil ${req.params.profileId}:`, error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo obtener la configuración del perfil',
		});
	}
});

// PUT /api/system/profiles/:profileId/settings - Actualizar configuración de un perfil específico
router.put('/profiles/:profileId/settings', async (req, res) => {
	try {
		const { profileId } = req.params;
		const updatedSettings = await updateProfileSettings(profileId, req.body);
		res.json(updatedSettings);
	} catch (error) {
		serverLogger.error(`Error actualizando configuración del perfil ${req.params.profileId}:`, error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo actualizar la configuración del perfil',
		});
	}
});

// POST /api/system/profiles/:profileId/settings/reset - Resetear configuración de un perfil
router.post('/profiles/:profileId/settings/reset', async (req, res) => {
	try {
		const { profileId } = req.params;
		await resetProfileSettings(profileId);
		res.json({ success: true, message: 'Configuración del perfil reseteada' });
	} catch (error) {
		serverLogger.error(`Error reseteando configuración del perfil ${req.params.profileId}:`, error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo resetear la configuración del perfil',
		});
	}
});

// POST /api/system/settings/default - Crear datos de configuración por defecto
router.post('/settings/default', async (_req, res) => {
	try {
		const defaultSettings = await createDefaultSettingsData();
		res.json(defaultSettings);
	} catch (error) {
		serverLogger.error('Error creando configuración por defecto:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo crear la configuración por defecto',
		});
	}
});

// GET /api/system/health - Estado general del sistema de reindexado
router.get('/health', async (_req, res) => {
	try {
		const systemHealth = reindexMonitor.getSystemHealth();
		const operationsMetrics = reindexMonitor.getOperationsMetrics();
		const circuitBreakers = circuitBreakerRegistry.getStats();

		res.json({
			status: 'ok',
			timestamp: Date.now(),
			health: systemHealth,
			operations: operationsMetrics,
			circuitBreakers,
		});
	} catch (error) {
		serverLogger.error('Error obteniendo health del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo obtener el estado del sistema',
		});
	}
});

// POST /api/system/reindex/reset - Reset del sistema de reindexado
router.post('/reindex/reset', async (_req, res) => {
	try {
		reindexMonitor.reset();
		circuitBreakerRegistry.resetAll();

		res.json({
			message: 'Sistema de reindexado reseteado correctamente',
			timestamp: Date.now(),
		});
	} catch (error) {
		serverLogger.error('Error reseteando sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo resetear el sistema',
		});
	}
});

// POST /api/system/reindex/cancel - Cancelar operaciones activas
router.post('/reindex/cancel', async (_req, res) => {
	try {
		reindexMonitor.cancelAllActiveOperations();

		res.json({
			message: 'Operaciones activas canceladas',
			timestamp: Date.now(),
		});
	} catch (error) {
		serverLogger.error('Error cancelando operaciones:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudieron cancelar las operaciones',
		});
	}
});

// ENDPOINT TEMPORAL PARA DEBUG DE BASE DE DATOS
router.get('/dbinfo', async (_req, res) => {
	try {
		const info = await getDatabaseInfo();
		res.json(info);
	} catch (error) {
		res.status(500).json({ error: 'No se pudo obtener información de la base de datos', details: error });
	}
});

export default router;
