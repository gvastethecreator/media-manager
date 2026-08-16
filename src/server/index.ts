// Cargar variables de entorno primero

import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { createServer } from 'node:http';
import path from 'path';
import { isLoopbackHost, resolveLocalServiceHost } from '@/config/local-runtime-security';
import {
	checkDatabaseConnection,
	closeDatabaseGracefully,
	ensureDatabaseReady,
	recordDatabaseError,
} from '@/lib/drizzle';
import type { RuntimeHealthStatus } from '@/runtime/runtime-health';
import {
	API_HTTP_SERVER_OPTIONS,
	API_JSON_BODY_LIMIT,
	API_URLENCODED_BODY_LIMIT,
	MAX_REQUEST_BODY_BYTES,
} from '@/runtime/http-limits';
import { initializeFileLogging } from '@/lib/logger/init-file-logging';
import { reindexMonitor } from '@/lib/system/reindex-monitor';
import { errorLogger, logError, logInfo, logWarning, requestLogger } from './middleware/logging';
import { publicErrorHandler } from './middleware/public-error-handler';
import { limitRequestBody } from './middleware/request-body-limit';
import { syncCanonicalMediaRoots } from '@/services/media-core/media-root-registry.service';
import { createLocalApiSessionMiddleware, resolveLocalApiSessionOptions } from './middleware/local-api-session';
import { registerRoutes } from './route-registry';
import { createAuthorizedRootRegistryFromEnvironment } from './security/authorized-roots';
import { reconcilePendingFileMutations } from './security/file-mutation-recovery';
import { sanitizeJsonResponses } from './security/sanitize-public-payload';

const app = express();
let runtimeHealthStatus: RuntimeHealthStatus = 'starting';
await ensureDatabaseReady();
app.locals.authorizedRootRegistry = await createAuthorizedRootRegistryFromEnvironment();
await syncCanonicalMediaRoots(app.locals.authorizedRootRegistry);
const mutationRecovery = await reconcilePendingFileMutations(app.locals.authorizedRootRegistry);
app.locals.startupFileMutationRecovery = mutationRecovery;
if (mutationRecovery.manual > 0) {
	logError(`La recuperación de archivos requiere revisión manual: ${mutationRecovery.manual} operación(es).`);
} else if (mutationRecovery.completed > 0 || mutationRecovery.pending > 0) {
	logWarning(
		`Recuperación de archivos: ${mutationRecovery.completed} reconciliada(s), ${mutationRecovery.pending} pendiente(s).`
	);
}

const PORT = Number.parseInt(process.env.API_PORT || process.env.PORT || '4000', 10);
const HOST = resolveLocalServiceHost({
	allowExternalBind: process.env.ALLOW_EXTERNAL_BIND === '1',
	host: process.env.API_HOST,
	serviceName: 'Express API',
});
const localApiSession = createLocalApiSessionMiddleware(resolveLocalApiSessionOptions());

// Security headers
import helmet from 'helmet';

app.use(
	helmet({
		// El broker local aplica CSP al documento HTML. El backend también sirve contenido para iframes y no debe bloquearlo.
		contentSecurityPolicy: false,
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
app.use(requestLogger as RequestHandler);

app.get('/health', async (_req, res) => {
	let status = runtimeHealthStatus;
	if (status === 'ready' && !(await checkDatabaseConnection())) status = 'degraded';
	res.status(status === 'ready' ? 200 : 503).json({
		status,
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

app.use(['/api', '/uploads'], localApiSession);
app.use('/api/', apiLimiter);
app.use('/api', sanitizeJsonResponses);

app.use(limitRequestBody(MAX_REQUEST_BODY_BYTES));
app.use(express.json({ limit: API_JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: API_URLENCODED_BODY_LIMIT }));

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';
app.use('/uploads', express.static(path.resolve(UPLOADS_DIR)));

registerRoutes(app);

app.use((req, res) => {
	res.status(404).json({ code: 'ENDPOINT_NOT_FOUND', error: 'Endpoint no encontrado' });
});

app.use(errorLogger as ErrorRequestHandler);
app.use(((error, req, res, next) => {
	recordDatabaseError(error);
	publicErrorHandler(error, req, res, next);
}) as ErrorRequestHandler);

const server = createServer(API_HTTP_SERVER_OPTIONS, app);
server.listen(PORT, HOST, () => {
	runtimeHealthStatus = 'ready';
	logInfo(`🚀 Servidor Express iniciado en http://${HOST}:${PORT}`);
	if (!isLoopbackHost(HOST)) {
		logError(`⚠️ API expuesta fuera de loopback en ${HOST}; ALLOW_EXTERNAL_BIND está activo.`);
	}
	reindexMonitor.start();
	initializeFileLogging();
});

server.once('error', (error) => {
	runtimeHealthStatus = 'degraded';
	logError(
		`El servidor no pudo escuchar en ${HOST}:${PORT}: ${error instanceof Error ? error.message : String(error)}`
	);
	if (!server.listening) {
		void closeDatabaseGracefully().finally(() => process.exit(1));
	}
});

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
	if (shuttingDown) return;
	shuttingDown = true;
	runtimeHealthStatus = 'stopping';
	logInfo(`Cierre ordenado iniciado por ${signal}.`);
	reindexMonitor.stop();
	const forcedExit = setTimeout(() => {
		logError('El cierre ordenado excedió 10 segundos; finalizando el proceso.');
		process.exit(1);
	}, 10_000);
	forcedExit.unref();
	server.close(async (serverError) => {
		try {
			if (serverError) throw serverError;
			await closeDatabaseGracefully();
			clearTimeout(forcedExit);
			process.exit(0);
		} catch (error) {
			logError(`Cierre ordenado falló: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

export default app;
