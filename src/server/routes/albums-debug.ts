import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
	console.log('🚨 ALBUMS DEBUG ENDPOINT');
	res.json({
		debug: true,
		message: 'Albums debug endpoint funciona correctamente',
		timestamp: new Date().toISOString(),
	});
});

export default router;
