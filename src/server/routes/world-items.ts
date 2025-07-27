import express from 'express';

const router = express.Router();

// Endpoint básico de world-items
router.get('/', (_req, res) => {
	res.json({ message: 'World Items endpoint activo' });
});

export default router;
