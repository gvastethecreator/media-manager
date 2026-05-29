// Cargar variables de entorno primero

import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import path from 'path';
import { initializeFileLogging } from '@/lib/logger/init-file-logging';
import { reindexMonitor } from '@/lib/system/reindex-monitor';
import { errorLogger, logError, logInfo, requestLogger } from './middleware/logging';
import { registerRoutes } from './route-registry';

const app = express();

// Configuración para manejar headers grandes (error 431)
app.use((req, res, next) => {
	res.setHeader('X-Max-Header-Size', '32768'); // 32KB
	next();
});

const PORT = Number.parseInt(process.env.API_PORT || process.env.PORT || '4000', 10);

// Security headers
import helmet from 'helmet';

app.use(
	helmet({
		contentSecurityPolicy: false, // Deshabilitado para SPA (Vite inyecta scripts inline)
		crossOriginEmbedderPolicy: false, // Permite cargar recursos cross-origin (thumbnails, etc.)
	})
);

// Rate limiting para prevenir DoS
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 1000, // Límite generoso para app local
	standardHeaders: true,
	legacyHeaders: false,
	skip: () => process.env.NODE_ENV === 'development',
	message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';
app.use('/uploads', express.static(path.resolve(UPLOADS_DIR)));

app.use(requestLogger as RequestHandler);

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

registerRoutes(app);

app.use((req, res) => {
	res.status(404).json({ error: 'Endpoint no encontrado', path: req.originalUrl });
});

app.use(errorLogger as ErrorRequestHandler);

app.listen(PORT, '0.0.0.0', () => {
	logInfo(`🚀 Servidor Express iniciado en puerto ${PORT}`);
	reindexMonitor.start();
	initializeFileLogging();
});

export default app;
