import { Router } from 'express';

const router = Router();

// GET /api/videos/:id/thumbnail - Servir thumbnail de video (endpoint temporal de debug)
router.get('/:id/thumbnail', async (req, res) => {
	console.log('🎬 DEBUG TEMP: Entrando al endpoint thumbnail temporal');

	try {
		res.status(200).json({
			status: 'endpoint temporal funcionando correctamente',
			videoId: req.params.id,
			timestamp: Date.now(),
			message: 'Handler temporal sin duplicaciones',
		});
	} catch (error) {
		console.error('Error en thumbnail endpoint temporal:', error);
		res
			.status(500)
			.json({ error: 'Error en endpoint temporal', message: error instanceof Error ? error.message : String(error) });
	}
});

export { router as videosThumbnailRouter };
