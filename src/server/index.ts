// Cargar variables de entorno primero

import express from 'express';
import path from 'path';
import { serverLogger } from '@/lib/logger';
import { initializeFileLogging } from '@/lib/logger/init-file-logging';
import { reindexMonitor } from '@/lib/system/reindex-monitor';
import { errorLogger, logError, logInfo, requestLogger } from './middleware/logging';
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
// Force restart
import downloadRouter from './routes/download.js';
import eventsRouter from './routes/events';
import favoritesRouter from './routes/favorites';
import file3dsRouter from './routes/file3ds.js';
import filesRouter from './routes/files.js';
import { foldersRouter } from './routes/folders/index';
import groupsRouter from './routes/groups';
import { imagesRouter } from './routes/images.js';
import imagesEffectRouter from './routes/images.effect';
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
import tagsEffectRouter from './routes/tags.effect';
import { FEATURES, logEnabledFeatures } from '@/config/features';
import tasksRouter from './routes/tasks';
import testCharactersRouter from './routes/test-characters';
import thumbnailsRouter from './routes/thumbnails';
import uploadedImagesRouter from './routes/uploaded-images';
import { videosRouter } from './routes/videos.js';
import videosEffectRouter from './routes/videos.effect';
import audiosEffectRouter from './routes/audios.effect';
import wildcardsRouter from './routes/wildcards';
import worldItemsRouter from './routes/world-items';

const app = express();

// Configuración para manejar headers grandes (error 431)
app.use((req, res, next) => {
	// Aumentar límite de headers para evitar error 431
	res.setHeader('X-Max-Header-Size', '32768'); // 32KB
	next();
});

const PORT = Number.parseInt(process.env.API_PORT || process.env.PORT || '4000', 10);
// ...existing code...
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar archivos estáticos para las imágenes
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';
app.use('/uploads', express.static(path.resolve(UPLOADS_DIR)));
logInfo(`📁 Archivos estáticos configurados: /uploads -> ${path.resolve(UPLOADS_DIR)}`);

// Middleware de logging
app.use(requestLogger);

logInfo('🔧 Middleware de logging configurado');

// Validar routers críticos
if (typeof foldersRouter !== 'function' || typeof imagesRouter !== 'function') {
	logError('❌ Routers críticos no están disponibles');
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
	serverLogger.debug('📁 FOLDERS ROUTER - Request received:', req.method, req.path);
	next();
});
app.use('/api/folders', foldersRouter);
// Images: cargar ruta condicional según feature flag
if (FEATURES.USE_EFFECT_IMAGES) {
	logInfo('✨ Usando ImageService con Effect-TS');
	app.use('/api/images', imagesEffectRouter);
} else {
	logInfo('📦 Usando ImageService legacy');
	app.use('/api/images', imagesRouter);
}
app.use('/api/files', filesRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/download', downloadRouter);
// Tags: cargar ruta condicional según feature flag
if (FEATURES.USE_EFFECT_TAGS) {
	logInfo('✨ Usando TagService con Effect-TS');
	app.use('/api/tags', tagsEffectRouter);
} else {
	logInfo('📦 Usando TagService legacy');
	app.use('/api/tags', tagsRouter);
}
app.use('/api/tasks', tasksRouter);
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

// Audios: cargar ruta condicional según feature flag
if (FEATURES.USE_EFFECT_AUDIOS) {
	logInfo('✨ Usando AudioService con Effect-TS');
	app.use('/api/audio', audiosEffectRouter);
} else {
	logInfo('📦 Usando AudioService legacy');
	app.use('/api/audio', audioRouter);
}

// Videos: cargar ruta condicional según feature flag
if (FEATURES.USE_EFFECT_VIDEOS) {
	logInfo('✨ Usando VideoService con Effect-TS');
	app.use('/api/videos', videosEffectRouter);
} else {
	logInfo('📦 Usando VideoService legacy');
	app.use('/api/videos', videosRouter);
}
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

app.listen(PORT, '0.0.0.0', () => {
	const logger = serverLogger.withContext('ServerStartup');

	logger.success(`🚀 Servidor Express iniciado en puerto ${PORT}`);

	logger.info('\n📁 APIs de Entidades:');
	logger.info(`   📁 Folders: http://localhost:${PORT}/api/folders`);
	logger.info(`   🖼️  Images: http://localhost:${PORT}/api/images`);
	logger.info(`   📂 Files: http://localhost:${PORT}/api/files`);
	logger.info(`   📸 Albums: http://localhost:${PORT}/api/albums`);
	logger.info(`   📥 Download: http://localhost:${PORT}/api/download`);
	logger.info(`   🏷️  Tags: http://localhost:${PORT}/api/tags`);
	logger.info(`   👤 Characters: http://localhost:${PORT}/api/characters`);
	logger.info(`   🌟 Collections: http://localhost:${PORT}/api/collections`);
	logger.info(`   📍 Places: http://localhost:${PORT}/api/places`);
	logger.info(`   🎯 World Items: http://localhost:${PORT}/api/world-items`);
	logger.info(`   💡 Concepts: http://localhost:${PORT}/api/concepts`);
	logger.info(`   🤖 Prompts: http://localhost:${PORT}/api/prompts`);
	logger.info(`   📤 Uploaded Images: http://localhost:${PORT}/api/uploaded-images`);
	logger.info(`   ✨ Wildcards: http://localhost:${PORT}/api/wildcards`);
	logger.info(`   🎵 Audio: http://localhost:${PORT}/api/audio`);
	logger.info(`   🎬 Videos: http://localhost:${PORT}/api/videos`);
	logger.info(`   📝 Notes: http://localhost:${PORT}/api/notes`);
	logger.info(`   ⚙️  Properties: http://localhost:${PORT}/api/properties`);
	logger.info(`   👥 Groups: http://localhost:${PORT}/api/groups`);
	logger.info(`   ⭐ Favorites: http://localhost:${PORT}/api/favorites`);
	logger.info(`   📂 Local Files: http://localhost:${PORT}/api/local-files`);
	logger.info(`   🐞 Debug: http://localhost:${PORT}/api/debug`);
	logger.info(`   📦 Queue: http://localhost:${PORT}/api/queue`);

	logger.info('\n🔧 APIs de Sistema:');
	logger.info(`   🖥️  System: http://localhost:${PORT}/api/system`);
	logger.info(`   🔍 Search: http://localhost:${PORT}/api/search`);
	logger.info(`   📋 Metadata: http://localhost:${PORT}/api/metadata`);
	logger.info(`   🤖 Metadata Advanced: http://localhost:${PORT}/api/metadata-advanced`);
	logger.info(`   🖼️  Thumbnails: http://localhost:${PORT}/api/thumbnails`);
	logger.info(`   📊 Stats: http://localhost:${PORT}/api/stats`);
	logger.info(`   👤 Profiles: http://localhost:${PORT}/api/profiles`);
	logger.info(`   📈 Activity: http://localhost:${PORT}/api/activity`);

	logger.info(`\n🩺 Health check: http://localhost:${PORT}/health`);

	// 🔍 Inicializar monitor de reindexado
	logger.info('\n🔍 Iniciando sistema de monitoreo...');
	reindexMonitor.start();
	logger.success('✅ Monitor de reindexado activo');

	// 📝 Inicializar sistema de logging de archivos
	logger.info('\n📝 Inicializando sistema de logging de archivos...');
	initializeFileLogging();
	logger.success('✅ Sistema de logging de archivos activo');
});

export default app;
