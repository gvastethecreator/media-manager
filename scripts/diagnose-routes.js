#!/usr/bin/env bun
/**
 * Script para diagnosticar rutas problemáticas en Express
 */

import express from 'express';

const app = express();

// Lista de archivos de rutas para probar
const routeFiles = [
	'./src/server/routes/albums.js',
	'./src/server/routes/audio.js',
	'./src/server/routes/characters.ts',
	'./src/server/routes/collections.ts',
	'./src/server/routes/concepts.ts',
	'./src/server/routes/debug.js',
	'./src/server/routes/documents.js',
	'./src/server/routes/download.js',
	'./src/server/routes/favorites.ts',
	'./src/server/routes/files-temp.ts',
	'./src/server/routes/folders.js',
	'./src/server/routes/groups.ts',
	'./src/server/routes/images.js',
	'./src/server/routes/json-files.ts',
	'./src/server/routes/local-files.js',
	'./src/server/routes/metadata.ts',
	'./src/server/routes/notes.ts',
	'./src/server/routes/places.ts',
	'./src/server/routes/profiles.ts',
	'./src/server/routes/prompts.ts',
	'./src/server/routes/properties.ts',
	'./src/server/routes/queue.ts',
	'./src/server/routes/search.ts',
	'./src/server/routes/stats.ts',
	'./src/server/routes/system.ts',
	'./src/server/routes/tags.ts',
	'./src/server/routes/thumbnails.ts',
	'./src/server/routes/uploaded-images.ts',
	'./src/server/routes/videos.js',
	'./src/server/routes/wildcards.ts',
	'./src/server/routes/workflows.js',
	'./src/server/routes/world-items.ts'
];

// Buscar patrones problemáticos con RegExp
const problematicPatterns = [
	/\/\*(?![a-zA-Z])/,  // /* sin nada después
	/\/\*$/,             // /* al final de línea
	/router\.\w+\(['"`]\/\*['"`]/,  // router.verb("/*")
	/app\.use\(['"`][^'"`]*\/\*['"`]/  // app.use con /*
];

console.log('🔍 Buscando patrones problemáticos en rutas...\n');

for (const pattern of problematicPatterns) {
	console.log(`Patrón: ${pattern.source}`);

	// Buscar en archivos TypeScript
	try {
		const { execSync } = require('child_process');
		const result = execSync(`grep -n "${pattern.source}" src/server/routes/*.ts`, { encoding: 'utf8' });
		if (result) {
			console.log('❌ Encontrados:', result);
		}
	} catch (error) {
		// No hay matches para este patrón
	}
}

console.log('\n✅ Diagnóstico completo');
process.exit(0);
