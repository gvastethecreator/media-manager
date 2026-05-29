import type { Express } from 'express';
import threeDThumbnailsRouter from './routes/3d-thumbnails';
import activityRouter from './routes/activity';
import albumsEffectRouter from './routes/albums.effect';
import { reindexIncrementalRouter } from './routes/api/reindex-incremental';
import { reindexLogsRouter } from './routes/api/reindex-logs';
import audioWaveformsRouter from './routes/audio-waveforms';
import audiosEffectRouter from './routes/audios.effect';
import charactersEffectRouter from './routes/characters.effect';
import collectionsEffectRouter from './routes/collections.effect';
import conceptsEffectRouter from './routes/concepts.effect';
import debugRouter from './routes/debug';
import debugEntityTypesRouter from './routes/debug/entity-types';
import { downloadEffectRouter } from './routes/download.effect';
import eventsEffectRouter from './routes/events.effect';
import favoritesEffectRouter from './routes/favorites.effect';
import {
	documentsEffectRouter,
	file3dsEffectRouter,
	jsonFilesEffectRouter,
	uploadedImagesEffectRouter,
} from './routes/file-services.effect';
import { filesEffectRouter } from './routes/files.effect';
import foldersEffectRouter from './routes/folders.effect';
import imagesEffectRouter from './routes/images.effect';
import jsonThumbnailsRouter from './routes/json-thumbnails';
import { metadataEffectRouter } from './routes/metadata.effect';
import metadataAdvancedRouter from './routes/metadata-advanced';
import placesEffectRouter from './routes/places.effect';
import profilesEffectRouter from './routes/profiles.effect';
import promptsEffectRouter from './routes/prompts.effect';
import { queueRouter } from './routes/queue';
import { searchEffectRouter } from './routes/search.effect';
import {
	groupsEffectRouter,
	notesEffectRouter,
	propertiesEffectRouter,
	wildcardsEffectRouter,
	worldItemsEffectRouter,
} from './routes/secondary-services.effect';
import settingsEffectRouter from './routes/settings.effect';
import statsRouter from './routes/stats';
import systemRouter from './routes/system';
import tagsEffectRouter from './routes/tags.effect';
import testCharactersRouter from './routes/test/characters';
import { thumbnailsEffectRouter } from './routes/thumbnails.effect';
import { thumbnailsUnifiedRouter } from './routes/thumbnails-unified';
import videosEffectRouter from './routes/videos.effect';

export function registerRoutes(app: Express): void {
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
	app.use('/api/json-files', jsonFilesEffectRouter);
	app.use('/api/uploaded-images', uploadedImagesEffectRouter);

	// Routers Effect migrados
	app.use('/api/files', filesEffectRouter);
	app.use('/api/download', downloadEffectRouter);
	app.use('/api/search', searchEffectRouter);
	app.use('/search', (req, res) => {
		const queryIndex = req.originalUrl.indexOf('?');
		const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
		const subPath = req.originalUrl.slice('/search'.length).split('?')[0] || '';
		res.redirect(307, `/api/search${subPath}${query}`);
	});
	app.use('/api/metadata', metadataEffectRouter);
	app.use('/api/thumbnails', thumbnailsEffectRouter);
	app.use('/api/favorites', favoritesEffectRouter);
	app.use('/api/documents', documentsEffectRouter);
	app.use('/api/settings', settingsEffectRouter);
	app.use('/api/profiles', profilesEffectRouter);
	app.use('/api/events', eventsEffectRouter);

	// Otros routers legacy (pendientes de migrar)
	app.use('/api/test-characters', testCharactersRouter);
	app.use('/api/json', jsonThumbnailsRouter);
	app.use('/api/audio-waveforms', audioWaveformsRouter);
	app.use('/api/3d', threeDThumbnailsRouter);
	app.use('/api/debug', debugRouter);
	app.use('/api/debug-entity-types', debugEntityTypesRouter);
	app.use('/api/queue', queueRouter);
	app.use('/api/system', systemRouter);
	app.use('/api/reindex-logs', reindexLogsRouter);
	app.use('/api/reindex', reindexIncrementalRouter);
	app.use('/api/metadata-advanced', metadataAdvancedRouter);
	app.use('/api/thumbnails/unified', thumbnailsUnifiedRouter);
	app.use('/api/stats', statsRouter);
	app.use('/api/activity', activityRouter);
}
