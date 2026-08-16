import { Router } from 'express';
import { serverLogger } from '@/lib/logger/server-logger';

const router = Router();

router.get('/', (_req, res) => {
	serverLogger.debug('🔍 TEST endpoint called');
	res.json({ message: 'Test endpoint works' });
});

export default router;
