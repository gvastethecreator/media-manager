import { Router } from 'express';
import { serverLogger } from '@/lib/logger/server-logger';

const router = Router();

router.get('/', (req, res) => {
	serverLogger.debug('🚨 ENDPOINT DIAGNÓSTICO TOTALMENTE NUEVO');
	res.json({
		debug: true,
		message: 'Endpoint de diagnóstico funciona correctamente',
		timestamp: new Date().toISOString(),
		path: req.path,
		method: req.method,
	});
});

export default router;
