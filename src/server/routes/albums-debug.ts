import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';

const router = express.Router();

router.get('/', (_req, res) => {
	serverLogger.debug('🚨 ALBUMS DEBUG ENDPOINT');
	res.json({
		debug: true,
		message: 'Albums debug endpoint funciona correctamente',
		timestamp: new Date().toISOString(),
	});
});

export default router;
