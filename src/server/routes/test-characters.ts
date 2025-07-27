import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
	console.log('🔍 TEST endpoint called');
	res.json({ message: 'Test endpoint works' });
});

export default router;
