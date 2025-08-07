import express from 'express';

console.log('🤖 Metadata Advanced Test Router - SIMPLE VERSION');

const router = express.Router();

router.get('/test', (_req, res) => {
	console.log('🔍 Simple test route executed');
	res.json({ message: 'Simple test working' });
});

export default router;
