// Cargar variables de entorno primero

import express from 'express';
import path from 'path';
import { initializeFileLogging } from '@/lib/logger/init-file-logging';
import { reindexMonitor } from '@/lib/system/reindex-monitor';
import { errorLogger, logError, logInfo, requestLogger } from './middleware/logging';
import activityRouter from './routes/activity';
import albumsEffectRouter from './routes/albums.effect.js';
import { reindexIncrementalRouter } from './routes/api/reindex-incremental.js';
import { reindexLogsRouter } from './routes/api/reindex-logs.js';
import audiosEffectRouter from './routes/audios.effect';
import charactersEffectRouter from './routes/characters.effect.js';
import collectionsEffectRouter from './routes/collections.effect.js';
import debugRouter from './routes/debug.js';
import debugEntityTypesRouter from './routes/debug-entity-types.js';
import downloadRouter from './routes/download.js';
import eventsRouter from './routes/events';
import favoritesRouter from './routes/favorites';
import {
	documentsEffectRouter,
	file3dsEffectRouter,
	jsonFilesEffectRouter,
	uploadedImagesEffectRouter,
} from './routes/file-services.effect.js';
import filesRouter from './routes/files.js';
import foldersEffectRouter from './routes/folders.effect.js';
import imagesEffectRouter from './routes/images.effect';
import jsonThumbnailsRouter from './routes/json-thumbnails';
import localFilesRouter from './routes/local-files-simple.js';
import metadataRouter from './routes/metadata';
import audioWaveformsRouter from './routes/audio-waveforms';
import documentsRouter from './routes/documents';
import threeDThumbnailsRouter from './routes/3d-thumbnails';
import metadataAdvancedRouter from './routes/metadata-advanced';
import profilesRouter from './routes/profiles';
import { queueRouter } from './routes/queue';
import searchRouter from './routes/search';
import {
	groupsEffectRouter,
	notesEffectRouter,
	propertiesEffectRouter,
	wildcardsEffectRouter,
	worldItemsEffectRouter,
} from './routes/secondary-services.effect.js';
import settingsRouter from './routes/settings';
import statsRouter from './routes/stats';
import systemRouter from './routes/system';
import tagsEffectRouter from './routes/tags.effect';
import tasksRouter from './routes/tasks';
import testCharactersRouter from './routes/test-characters';
import thumbnailsRouter from './routes/thumbnails';
import videosEffectRouter from './routes/videos.effect';
import {
	conceptsRouter as conceptsEffectRouter,
	placesRouter as placesEffectRouter,
	promptsRouter as promptsEffectRouter,
} from './routes/worldbuilding.effect.js';

const app = express();

// Configuración para manejar headers grandes (error 431)
app.use((req, res, next) => {
	res.setHeader('X-Max-Header-Size', '32768'); // 32KB
	next();
});

const PORT = Number.parseInt(process.env.API_PORT || process.env.PORT || '4000', 10);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';
app.use('/uploads', express.static(path.resolve(UPLOADS_DIR)));

app.use(requestLogger);

if (typeof foldersEffectRouter !== 'function' || typeof imagesEffectRouter !== 'function') {
	logError('❌ Routers críticos no están disponibles');
	process.exit(1);
}

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Routers
app.use('/api/folders', foldersEffectRouter);
app.use('/api/images', imagesEffectRouter);
app.use('/api/tags', tagsEffectRouter);
app.use('/api/albums', albumsEffectRouter);
app.use('/api/collections', collectionsEffectRouter);
app.use('/api/characters', charactersEffectRouter);
app.use('/api/places', placesEffectRouter);
app.use('/api/concepts', conceptsEffectRouter);
app.use('/api/prompts', promptsEffectRouter);
app.use('/api/audio', audiosEffectRouter);
app.use('/api/videos', videosEffectRouter);

// Servicios secundarios
app.use('/api/groups', groupsEffectRouter);
app.use('/api/wildcards', wildcardsEffectRouter);
app.use('/api/notes', notesEffectRouter);
app.use('/api/properties', propertiesEffectRouter);
app.use('/api/world-items', worldItemsEffectRouter);

// Servicios de archivos
app.use('/api/file3ds', file3dsEffectRouter);
app.use('/api/documents', documentsEffectRouter);
app.use('/api/json-files', jsonFilesEffectRouter);
app.use('/api/uploaded-images', uploadedImagesEffectRouter);

// Otros routers
app.use('/api/files', filesRouter);
app.use('/api/download', downloadRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/test-characters', testCharactersRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/json', jsonThumbnailsRouter);
app.use('/api/audio', audioWaveformsRouter);
app.use('/api/3d', threeDThumbnailsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/local-files', localFilesRouter);
app.use('/api/debug', debugRouter);
app.use('/api/debug-entity-types', debugEntityTypesRouter);
app.use('/api/queue', queueRouter);
app.use('/api/system', systemRouter);
app.use('/api/reindex-logs', reindexLogsRouter);
app.use('/api/reindex', reindexIncrementalRouter);
app.use('/api/search', searchRouter);
app.use('/api/metadata', metadataRouter);
app.use('/api/metadata-advanced', metadataAdvancedRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/thumbnails', thumbnailsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/events', eventsRouter);

app.use((req, res) => {
	res.status(404).json({ error: 'Endpoint no encontrado', path: req.originalUrl });
});

app.use(errorLogger);

app.listen(PORT, '0.0.0.0', () => {
	logInfo(`🚀 Servidor Express iniciado en puerto ${PORT}`);
	reindexMonitor.start();
	initializeFileLogging();
});

export default app;
