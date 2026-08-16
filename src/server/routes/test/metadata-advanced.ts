import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';

const router = express.Router();

serverLogger.debug('🤖 Router metadata-advanced-test cargado');

router.get('/test', (_req, res) => {
	serverLogger.debug('🔍 TEST: Ruta /test ejecutándose en metadata-advanced-test');
	res.json({ message: 'Test route working from metadata-advanced-test', timestamp: new Date().toISOString() });
});

export default router;
