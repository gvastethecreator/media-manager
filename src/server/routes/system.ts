import { getNavigationData } from '../services/system.service';
import express from 'express';
import {
	getNavigationData,
	getSystemStats,
	repairSystem,
	resetDatabase,
	getSystemVersion,
	getSystemSettings,
	updateSystemSettings,
	resetSystemSettings,
	getProfileSettings,
	updateProfileSettings,
	resetProfileSettings,
	createDefaultSettingsData,
} from '../services/system.service';

const router = express.Router();

// GET /api/system/navigation - Obtener datos de navegación
router.get('/navigation', async (req, res) => {
	try {
		const navigationData = await getNavigationData();
		res.json(navigationData);
	} catch (error) {
		console.error('Error obteniendo datos de navegación:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudieron obtener los datos de navegación'
		});
	}
});

// GET /api/system/health - Health check del sistema
router.get('/health', async (req, res) => {
	try {
		res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			version: process.version
		});
	} catch (error) {
		console.error('Error en health check:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'Error en health check'
		});
	}
});

// GET /api/system/stats - Obtener estadísticas del sistema
router.get('/stats', async (req, res) => {
	try {
		const stats = await getSystemStats();
		res.json(stats);
	} catch (error) {
		console.error('Error obteniendo estadísticas del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudieron obtener las estadísticas del sistema'
		});
	}
});

// POST /api/system/repair - Reparar el sistema
router.post('/repair', async (req, res) => {
	try {
		const result = await repairSystem();
		res.json(result);
	} catch (error) {
		console.error('Error reparando el sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo reparar el sistema'
		});
	}
});

// POST /api/system/reset-db - Resetear la base de datos
router.post('/reset-db', async (req, res) => {
	try {
		const result = await resetDatabase();
		res.json(result);
	} catch (error) {
		console.error('Error reseteando la base de datos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo resetear la base de datos'
		});
	}
});

// GET /api/system/version - Obtener versión del sistema
router.get('/version', async (req, res) => {
	try {
		const version = await getSystemVersion();
		res.json(version);
	} catch (error) {
		console.error('Error obteniendo versión del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo obtener la versión del sistema'
		});
	}
});

// GET /api/system/settings - Obtener configuración global del sistema
router.get('/settings', async (req, res) => {
	try {
		const settings = await getSystemSettings();
		res.json(settings);
	} catch (error) {
		console.error('Error obteniendo configuración del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo obtener la configuración del sistema'
		});
	}
});

// PUT /api/system/settings - Actualizar configuración global del sistema
router.put('/settings', async (req, res) => {
	try {
		const updatedSettings = await updateSystemSettings(req.body);
		res.json(updatedSettings);
	} catch (error) {
		console.error('Error actualizando configuración del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo actualizar la configuración del sistema'
		});
	}
});

// POST /api/system/settings/reset - Resetear configuración global del sistema
router.post('/settings/reset', async (req, res) => {
	try {
		const resetSettings = await resetSystemSettings();
		res.json(resetSettings);
	} catch (error) {
		console.error('Error reseteando configuración del sistema:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo resetear la configuración del sistema'
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
		console.error(`Error obteniendo configuración del perfil ${req.params.profileId}:`, error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo obtener la configuración del perfil'
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
		console.error(`Error actualizando configuración del perfil ${req.params.profileId}:`, error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo actualizar la configuración del perfil'
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
		console.error(`Error reseteando configuración del perfil ${req.params.profileId}:`, error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo resetear la configuración del perfil'
		});
	}
});

// POST /api/system/settings/default - Crear datos de configuración por defecto
router.post('/settings/default', async (req, res) => {
	try {
		const defaultSettings = await createDefaultSettingsData();
		res.json(defaultSettings);
	} catch (error) {
		console.error('Error creando configuración por defecto:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudo crear la configuración por defecto'
		});
	}
});

export default router;
