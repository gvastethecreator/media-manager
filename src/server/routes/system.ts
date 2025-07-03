import { getNavigationData } from '@/components/navigation/actions/navigation.actions';
import express from 'express';

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

export default router;
