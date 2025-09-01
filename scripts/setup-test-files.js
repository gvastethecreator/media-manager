#!/usr/bin/env node

// Script para configurar archivos de prueba y ejecutar reindexación

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../src/lib/drizzle/index.js';
import { folders } from '../src/lib/drizzle/schema/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupTestFiles() {
	try {
		console.log('🔧 Configurando carpeta test-files...');

		// Crear carpeta test-files en la base de datos
		const testFilesPath = path.join(dirname(__dirname), 'test-files');

		const testFolder = {
			id: 'test-files',
			name: 'test-files',
			path: testFilesPath,
			description: 'Carpeta para probar archivos multi-formato',
			emoji: '🧪',
			color: '#22c55e',
			totalFiles: 0,
			totalSize: 0,
			isFavorite: false,
			lastIndexed: Date.now(),
			createdAt: Date.now(),
			updatedAt: Date.now(),
			parentId: null,
			presetId: null,
		};

		await db.insert(folders).values(testFolder);
		console.log('✅ Carpeta test-files creada en la base de datos');

		// Ahora hacer una petición POST al endpoint de reindexación
		console.log('🔄 Ejecutando reindexación...');

		const reindexUrl = 'http://localhost:4000/api/folders/reindex-all';
		const response = await fetch(reindexUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				enableSync: true,
			}),
		});

		if (response.ok) {
			const result = await response.json();
			console.log('✅ Reindexación completada:', result);
		} else {
			console.error('❌ Error en reindexación:', response.status, await response.text());
		}
	} catch (error) {
		console.error('❌ Error en setup:', error);
	}
}

setupTestFiles();
