#!/usr/bin/env bun

/**
 * Script para debuggear el problema de rutas del servidor
 */

import cors from 'cors';
import express from 'express';
import { ENV } from '../src/config/env.js';

const app = express();

// Middleware básico
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check básico
app.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('🔍 Probando servidor básico...');

try {
	// Importar rutas una por una para identificar cuál causa el problema
	const routesToTest = [
		{ name: 'folders', path: '../src/server/routes/folders.js' },
		{ name: 'images', path: '../src/server/routes/images.js' },
		{ name: 'files', path: '../src/server/routes/files.js' },
		{ name: 'albums', path: '../src/server/routes/albums.js' },
		{ name: 'download', path: '../src/server/routes/download.js' },
		{ name: 'tags', path: '../src/server/routes/tags.js' },
		{ name: 'characters', path: '../src/server/routes/characters.js' },
		{ name: 'collections', path: '../src/server/routes/collections.js' },
		{ name: 'places', path: '../src/server/routes/places.js' },
		{ name: 'world-items', path: '../src/server/routes/world-items.js' },
		{ name: 'concepts', path: '../src/server/routes/concepts.js' },
		{ name: 'prompts', path: '../src/server/routes/prompts.js' },
		{ name: 'uploaded-images', path: '../src/server/routes/uploaded-images.js' },
		{ name: 'wildcards', path: '../src/server/routes/wildcards.js' },
		{ name: 'audio', path: '../src/server/routes/audio.js' },
		{ name: 'videos', path: '../src/server/routes/videos.js' },
		{ name: 'documents', path: '../src/server/routes/documents.js' },
		{ name: 'workflows', path: '../src/server/routes/workflows.js' },
		{ name: 'notes', path: '../src/server/routes/notes.js' },
		{ name: 'properties', path: '../src/server/routes/properties.js' },
		{ name: 'groups', path: '../src/server/routes/groups.js' },
		{ name: 'favorites', path: '../src/server/routes/favorites.js' },
		{ name: 'json-files', path: '../src/server/routes/json-files.js' },
		{ name: 'local-files', path: '../src/server/routes/local-files.js' },
		{ name: 'debug', path: '../src/server/routes/debug.js' },
		{ name: 'queue', path: '../src/server/routes/queue.js' },
		{ name: 'system', path: '../src/server/routes/system.js' },
		{ name: 'search', path: '../src/server/routes/search.js' },
		{ name: 'metadata', path: '../src/server/routes/metadata.js' },
		{ name: 'thumbnails', path: '../src/server/routes/thumbnails.js' },
		{ name: 'stats', path: '../src/server/routes/stats.js' },
		{ name: 'profiles', path: '../src/server/routes/profiles.js' },
		{ name: 'activity', path: '../src/server/routes/activity.js' },
	];

	console.log('🧪 Probando importación de rutas una por una...\n');

	for (const route of routesToTest) {
		try {
			console.log(`⏳ Probando ruta: ${route.name}...`);

			// Intentar importar la ruta
			const routerModule = await import(route.path);
			const router =
				routerModule.default ||
				routerModule[`${route.name}Router`] ||
				routerModule[`${route.name.replace('-', '')}Router`];

			if (router) {
				// Intentar agregar la ruta a la app
				app.use(`/api/${route.name}`, router);
				console.log(`✅ ${route.name} - OK`);
			} else {
				console.log(`⚠️  ${route.name} - Router no encontrado en exportación`);
			}
		} catch (error) {
			console.error(`❌ ERROR en ruta ${route.name}:`, error.message);
			console.error(`   Archivo: ${route.path}`);
			break; // Parar en el primer error para identificar exactamente cuál es el problema
		}
	}

	// Si llegamos aquí, intentar iniciar el servidor
	const PORT = ENV.API_PORT;
	app.listen(PORT, () => {
		console.log(`\n🚀 Servidor de prueba iniciado en puerto ${PORT}`);
		console.log(`🩺 Health check: http://localhost:${PORT}/health`);
		console.log('\n✅ Todas las rutas se cargaron correctamente');
	});
} catch (error) {
	console.error('❌ Error fatal:', error);
	process.exit(1);
}
