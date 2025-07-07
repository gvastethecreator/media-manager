// Cargar variables de entorno primero

import cors from 'cors';
import express from 'express';
import activityRouter from './routes/activity';
import { albumsRouter } from './routes/albums.js';
import { audioRouter } from './routes/audio.js';
import charactersRouter from './routes/characters';
import collectionsRouter from './routes/collections';
import conceptsRouter from './routes/concepts';
import debugRouter from './routes/debug.js';
import { documentsRouter } from './routes/documents.js';
import downloadRouter from './routes/download.js';
import favoritesRouter from './routes/favorites';
import filesRouter from './routes/files-temp.js';
import { foldersRouter } from './routes/folders.js';
import groupsRouter from './routes/groups';
import { imagesRouter } from './routes/images.js';
import jsonFilesRouter from './routes/json-files';
import localFilesRouter from './routes/local-files-simple.js';
import metadataRouter from './routes/metadata';
import notesRouter from './routes/notes';
import placesRouter from './routes/places';
import profilesRouter from './routes/profiles';
import promptsRouter from './routes/prompts';
import propertiesRouter from './routes/properties';
import { queueRouter } from './routes/queue';
import searchRouter from './routes/search';
import statsRouter from './routes/stats';
import systemRouter from './routes/system';
import tagsRouter from './routes/tags';
import thumbnailsRouter from './routes/thumbnails';
import uploadedImagesRouter from './routes/uploaded-images';
import { videosRouter } from './routes/videos.js';
import wildcardsRouter from './routes/wildcards';
import { workflowsRouter } from './routes/workflows.js';
import worldItemsRouter from './routes/world-items';

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || '3001';

// Middleware
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
		credentials: true,
	})
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - Entidades principales
app.use('/api/folders', foldersRouter);
app.use('/api/images', imagesRouter);
app.use('/api/files', filesRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/download', downloadRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/characters', charactersRouter);
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
app.use('/api/workflows', workflowsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/json-files', jsonFilesRouter);
app.use('/api/local-files', localFilesRouter);
app.use('/api/debug', debugRouter);
app.use('/api/queue', queueRouter);

// API Routes - Sistema y utilidades
app.use('/api/system', systemRouter);
app.use('/api/search', searchRouter);
app.use('/api/metadata', metadataRouter);
app.use('/api/thumbnails', thumbnailsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/activity', activityRouter);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error('Error del servidor:', err);
	res.status(500).json({
		error: 'Error interno del servidor',
		message: err.message,
		timestamp: new Date().toISOString(),
	});
});

// 404 handler - Usar middleware sin patrón wildcard para compatibilidad con Express 5
app.use((req, res) => {
	res.status(404).json({
		error: 'Endpoint no encontrado',
		path: req.originalUrl,
		method: req.method,
		timestamp: new Date().toISOString(),
	});
});

app.listen(PORT, () => {
	console.log(`🚀 Servidor Express iniciado en puerto ${PORT}`);
	console.log('\n📁 APIs de Entidades:');
	console.log(`   📁 Folders: http://localhost:${PORT}/api/folders`);
	console.log(`   🖼️  Images: http://localhost:${PORT}/api/images`);
	console.log(`   📂 Files: http://localhost:${PORT}/api/files`);
	console.log(`   📸 Albums: http://localhost:${PORT}/api/albums`);
	console.log(`   📥 Download: http://localhost:${PORT}/api/download`);
	console.log(`   🏷️  Tags: http://localhost:${PORT}/api/tags`);
	console.log(`   👤 Characters: http://localhost:${PORT}/api/characters`);
	console.log(`   🌟 Collections: http://localhost:${PORT}/api/collections`);
	console.log(`   📍 Places: http://localhost:${PORT}/api/places`);
	console.log(`   🎯 World Items: http://localhost:${PORT}/api/world-items`);
	console.log(`   💡 Concepts: http://localhost:${PORT}/api/concepts`);
	console.log(`   🤖 Prompts: http://localhost:${PORT}/api/prompts`);
	console.log(`   ✨ Wildcards: http://localhost:${PORT}/api/wildcards`);
	console.log(`   🎵 Audio: http://localhost:${PORT}/api/audio`);
	console.log(`   🎬 Videos: http://localhost:${PORT}/api/videos`);
	console.log(`   📝 Notes: http://localhost:${PORT}/api/notes`);
	console.log(`   ⚙️  Properties: http://localhost:${PORT}/api/properties`);
	console.log(`   👥 Groups: http://localhost:${PORT}/api/groups`);
	console.log(`   ⭐ Favorites: http://localhost:${PORT}/api/favorites`);
	console.log(`   📂 Local Files: http://localhost:${PORT}/api/local-files`);
	console.log(`   🐞 Debug: http://localhost:${PORT}/api/debug`);
	console.log(`   📦 Queue: http://localhost:${PORT}/api/queue`);

	console.log('\n🔧 APIs de Sistema:');
	console.log(`   🖥️  System: http://localhost:${PORT}/api/system`);
	console.log(`   🔍 Search: http://localhost:${PORT}/api/search`);
	console.log(`   📋 Metadata: http://localhost:${PORT}/api/metadata`);
	console.log(`   🖼️  Thumbnails: http://localhost:${PORT}/api/thumbnails`);
	console.log(`   📊 Stats: http://localhost:${PORT}/api/stats`);
	console.log(`   👤 Profiles: http://localhost:${PORT}/api/profiles`);
	console.log(`   📈 Activity: http://localhost:${PORT}/api/activity`);

	console.log(`\n🩺 Health check: http://localhost:${PORT}/health`);
});

export default app;
