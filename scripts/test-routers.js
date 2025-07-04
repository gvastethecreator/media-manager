#!/usr/bin/env bun
/**
 * Script para diagnosticar problemas de rutas de Express
 */

import express from 'express';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testIndividualRouters() {
	console.log('🔍 Probando routers individuales...\n');

	const routesDir = path.join(__dirname, '../src/server/routes');
	const files = await readdir(routesDir);

	for (const file of files) {
		if (!file.endsWith('.ts') || file.includes('temp') || file.includes('simple')) continue;

		console.log(`📁 Probando: ${file}`);
		try {
			const app = express();
			const routePath = path.join(routesDir, file);

			// Intentar importar dinámicamente el router
			const module = await import(routePath);
			const router = module.default || module;

			// Intentar registrar el router con una ruta de prueba
			app.use('/test', router);

			console.log(`✅ ${file} - OK`);
		} catch (error) {
			console.log(`❌ ${file} - ERROR:`, error.message);
			if (error.message.includes('Missing parameter name')) {
				console.log(`🚨 ENCONTRADO PROBLEMA EN: ${file}`);
				process.exit(1);
			}
		}
	}

	console.log('\n✅ Todos los routers probados individualmente');
}

testIndividualRouters().catch(console.error);
