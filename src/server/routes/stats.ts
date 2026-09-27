import express from 'express';

const router = express.Router();

router.use((_req, res) => {
	res.status(410).json({
		code: 'AUTHORIZED_SCOPE_REQUIRED',
		message: 'Las estadísticas globales fueron retiradas hasta disponer de agregados por media root.',
		retryable: false,
	});
});

export default router;
