import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';

serverLogger.debug('🤖 Metadata Advanced Test Router - SIMPLE VERSION');

const router = express.Router();

router.get('/test', (_req, res) => {
	serverLogger.debug('🔍 Simple test route executed');
	res.json({ message: 'Simple test working' });
});

export default router;
