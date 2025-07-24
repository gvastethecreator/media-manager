import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
	console.log('🚨 ENDPOINT DIAGNÓSTICO TOTALMENTE NUEVO');
	res.json({
		debug: true,
		message: 'Endpoint de diagnóstico funciona correctamente',
		timestamp: new Date().toISOString(),
		path: req.path,
		method: req.method,
	});
});

export default router;
