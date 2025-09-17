// Cargar variables de entorno primero

import express from 'express';
import path from 'path';
import { ENV } from '@/config/env';
import { serverLogger } from '@/lib/logger';
import { initializeFileLogging } from '@/lib/logger/init-file-logging';
import { reindexMonitor } from '@/lib/system/reindex-monitor';
import { errorLogger, logError, logInfo, requestLogger } from './middleware/logging';
import { applySecurityMiddleware, createUploadsRouter } from './middleware/security';
import threeDThumbnailsRouter from './routes/3d-thumbnails';
import activityRouter from './routes/activity';
import { albumsRouter } from './routes/albums.js';
import { reindexLogsRouter } from './routes/api/reindex-logs.js';
import { audioRouter } from './routes/audio.js';
import audioWaveformsRouter from './routes/audio-waveforms';
import charactersRouter from './routes/characters';
import collectionsRouter from './routes/collections';
import conceptsRouter from './routes/concepts';
import debugRouter from './routes/debug.js';
import debugEntityTypesRouter from './routes/debug-entity-types.js';
import documentsRouter from './routes/documents.js';
import downloadRouter from './routes/download.js';
import eventsRouter from './routes/events';
import favoritesRouter from './routes/favorites';
import file3dsRouter from './routes/file3ds.js';
import filesRouter from './routes/files.js';
import foldersRouter from './routes/folders.js';
import groupsRouter from './routes/groups';
import { imagesRouter } from './routes/images.js';
import jsonFilesRouter from './routes/json-files';
import jsonThumbnailsRouter from './routes/json-thumbnails';
import localFilesRouter from './routes/local-files-simple.js';
import metadataRouter from './routes/metadata';
import metadataAdvancedRouter from './routes/metadata-advanced';
import notesRouter from './routes/notes';
import placesRouter from './routes/places';
import profilesRouter from './routes/profiles';
import promptsRouter from './routes/prompts';
import propertiesRouter from './routes/properties';
import { queueRouter } from './routes/queue';
import searchRouter from './routes/search';
import settingsRouter from './routes/settings';
import statsRouter from './routes/stats';
import systemRouter from './routes/system';
import tagsRouter from './routes/tags';
import testCharactersRouter from './routes/test-characters';
import thumbnailsRouter from './routes/thumbnails';
import uploadedImagesRouter from './routes/uploaded-images';
import { videosRouter } from './routes/videos.js';
import wildcardsRouter from './routes/wildcards';
import worldItemsRouter from './routes/world-items';

const app = express();

applySecurityMiddleware(app);
logInfo('🛡️ Middleware de seguridad inicializado');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = Number.parseInt(ENV.API_PORT, 10);
const HOST = process.env.API_HOST || '0.0.0.0';
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';
const uploadsRouter = createUploadsRouter(UPLOADS_DIR);
app.use('/uploads', uploadsRouter);
const resolvedUploadsPath = path.resolve(UPLOADS_DIR);
logInfo(`📁 Archivos estáticos configurados: /uploads -> ${resolvedUploadsPath}`);

// Middleware de logging
app.use(requestLogger);

logInfo('📝 Middleware de logging configurado');
// Validar routers crÃ­ticos
if (typeof foldersRouter !== 'function' || typeof imagesRouter !== 'function') {
	logError('âŒ Routers crÃ­ticos no estÃ¡n disponibles');
	process.exit(1);
}

// Health check endpoint
app.get('/health', (_req, res) => {
	const uptime = process.uptime();
	const timestamp = new Date().toISOString();

	res.json({
		status: 'ok',
		timestamp,
		uptime,
	});
});

// API Routes - Entidades principales
// Debug middleware for folders routes
app.use('/api/folders', (req, res, next) => {
	console.log('ðŸ“ FOLDERS ROUTER - Request received:', req.method, req.path);
	next();
});
app.use('/api/folders', foldersRouter);
app.use('/api/images', imagesRouter);
app.use('/api/files', filesRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/download', downloadRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/characters', charactersRouter);
// app.use('/api/characters-debug', charactersDebugRouter); // DESHABILITADO - archivo no existe
// app.use('/api/albums-debug', albumsDebugRouter); // DESHABILITADO - archivo no existe
app.use('/api/test-characters', testCharactersRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/places', placesRouter);
app.use('/api/world-items', worldItemsRouter);
app.use('/api/concepts', conceptsRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/uploaded-images', uploadedImagesRouter);
app.use('/api/wildcards', wildcardsRouter);
app.use('/api/audio', audioRouter);
app.use('/api/videos', videosRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/file3ds', file3dsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/json-files', jsonFilesRouter);
app.use('/api/local-files', localFilesRouter);
app.use('/api/debug', debugRouter);
app.use('/api/debug-entity-types', debugEntityTypesRouter);
app.use('/api/queue', queueRouter);

// Alias sin prefijo para compatibilidad con pruebas y clientes legacy
app.use('/videos', videosRouter);
app.use('/search', searchRouter);

// API Routes - Sistema y utilidades
app.use('/api/system', systemRouter);
app.use('/api/reindex-logs', reindexLogsRouter);
app.use('/api/search', searchRouter);
app.use('/api/metadata', metadataRouter);
app.use('/api/metadata-advanced', metadataAdvancedRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/thumbnails', thumbnailsRouter);
app.use('/api/json', jsonThumbnailsRouter);
app.use('/api/3d', threeDThumbnailsRouter);
app.use('/api/audio', audioWaveformsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/events', eventsRouter);

// 404 handler - DEBE ir antes de los middlewares de error
app.use((req, res) => {
	res.status(404).json({
		error: 'Endpoint no encontrado',
		path: req.originalUrl,
		method: req.method,
		timestamp: new Date().toISOString(),
	});
});

// Middleware de manejo de errores (DEBE ir al final)
app.use(errorLogger);

app.listen(PORT, HOST, () => {
	const logger = serverLogger.withContext('ServerStartup');

	logger.success(`ðŸš€ Servidor Express iniciado en puerto ${PORT}`);

	logger.info('\nðŸ“ APIs de Entidades:');
	logger.info(`   ðŸ“ Folders: http://localhost:${PORT}/api/folders`);
	logger.info(`   ðŸ–¼ï¸  Images: http://localhost:${PORT}/api/images`);
	logger.info(`   ðŸ“‚ Files: http://localhost:${PORT}/api/files`);
	logger.info(`   ðŸ“¸ Albums: http://localhost:${PORT}/api/albums`);
	logger.info(`   ðŸ“¥ Download: http://localhost:${PORT}/api/download`);
	logger.info(`   ðŸ·ï¸  Tags: http://localhost:${PORT}/api/tags`);
	logger.info(`   ðŸ‘¤ Characters: http://localhost:${PORT}/api/characters`);
	logger.info(`   ðŸŒŸ Collections: http://localhost:${PORT}/api/collections`);
	logger.info(`   ðŸ“ Places: http://localhost:${PORT}/api/places`);
	logger.info(`   ðŸŽ¯ World Items: http://localhost:${PORT}/api/world-items`);
	logger.info(`   ðŸ’¡ Concepts: http://localhost:${PORT}/api/concepts`);
	logger.info(`   ðŸ¤– Prompts: http://localhost:${PORT}/api/prompts`);
	logger.info(`   ðŸ“¤ Uploaded Images: http://localhost:${PORT}/api/uploaded-images`);
	logger.info(`   âœ¨ Wildcards: http://localhost:${PORT}/api/wildcards`);
	logger.info(`   ðŸŽµ Audio: http://localhost:${PORT}/api/audio`);
	logger.info(`   ðŸŽ¬ Videos: http://localhost:${PORT}/api/videos`);
	logger.info(`   ðŸ“ Notes: http://localhost:${PORT}/api/notes`);
	logger.info(`   âš™ï¸  Properties: http://localhost:${PORT}/api/properties`);
	logger.info(`   ðŸ‘¥ Groups: http://localhost:${PORT}/api/groups`);
	logger.info(`   â­ Favorites: http://localhost:${PORT}/api/favorites`);
	logger.info(`   ðŸ“‚ Local Files: http://localhost:${PORT}/api/local-files`);
	logger.info(`   ðŸž Debug: http://localhost:${PORT}/api/debug`);
	logger.info(`   ðŸ“¦ Queue: http://localhost:${PORT}/api/queue`);

	logger.info('\nðŸ”§ APIs de Sistema:');
	logger.info(`   ðŸ–¥ï¸  System: http://localhost:${PORT}/api/system`);
	logger.info(`   ðŸ” Search: http://localhost:${PORT}/api/search`);
	logger.info(`   ðŸ“‹ Metadata: http://localhost:${PORT}/api/metadata`);
	logger.info(`   ðŸ¤– Metadata Advanced: http://localhost:${PORT}/api/metadata-advanced`);
	logger.info(`   ðŸ–¼ï¸  Thumbnails: http://localhost:${PORT}/api/thumbnails`);
	logger.info(`   ðŸ“Š Stats: http://localhost:${PORT}/api/stats`);
	logger.info(`   ðŸ‘¤ Profiles: http://localhost:${PORT}/api/profiles`);
	logger.info(`   ðŸ“ˆ Activity: http://localhost:${PORT}/api/activity`);

	logger.info(`\nðŸ©º Health check: http://localhost:${PORT}/health`);

	// ðŸ” Inicializar monitor de reindexado
	logger.info('\nðŸ” Iniciando sistema de monitoreo...');
	reindexMonitor.start();
	logger.success('âœ… Monitor de reindexado activo');

	// ðŸ“ Inicializar sistema de logging de archivos
	logger.info('\nðŸ“ Inicializando sistema de logging de archivos...');
	initializeFileLogging();
	logger.success('âœ… Sistema de logging de archivos activo');
});

export default app;






