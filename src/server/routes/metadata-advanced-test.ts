import express from 'express';

const router = express.Router();

console.log('🤖 Router metadata-advanced-test cargado');

router.get('/test', (_req, res) => {
  console.log('🔍 TEST: Ruta /test ejecutándose en metadata-advanced-test');
  res.json({ message: 'Test route working from metadata-advanced-test', timestamp: new Date().toISOString() });
});

export default router;
