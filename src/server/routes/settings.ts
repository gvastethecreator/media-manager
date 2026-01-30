import express from 'express';

const router = express.Router();

// Endpoint básico de settings
router.get('/', (_req, res) => {
	res.json({ message: 'Settings endpoint activo' });
});

export default router;
