#!/usr/bin/env bun
/**
 * Script para probar cada router individualmente e identificar cuál causa el error de path-to-regexp
 */

import express from 'express';
import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const routesDir = join(__dirname, '..', 'src', 'server', 'routes');

async function testRouter(routerFile) {
	const app = express();

	try {
		console.log(`\n🔍 Probando router: ${routerFile}`);

		// Importar el router
		const routerModule = await import(`../src/server/routes/${routerFile}`);
		const router = routerModule.default || routerModule;

		if (!router) {
			console.log(`⚠️  Router ${routerFile} no exporta un router válido`);
			return;
		}

		// Intentar registrar el router
		app.use('/test', router);

		console.log(`✅ Router ${routerFile} se registró correctamente`);
	} catch (error) {
		console.error(`❌ Error en router ${routerFile}:`, error.message);
		if (error.message.includes('Missing parameter name')) {
			console.error(`🎯 ENCONTRADO: ${routerFile} causa el error de path-to-regexp!`);
			throw error;
		}
	}
}

async function main() {
	try {
		console.log('🚀 Iniciando prueba individual de routers...\n');

		// Obtener todos los archivos .ts del directorio de rutas
		const files = await readdir(routesDir);
		const routerFiles = files.filter((file) => file.endsWith('.ts'));

		console.log(`📁 Encontrados ${routerFiles.length} archivos de rutas`);

		for (const file of routerFiles) {
			await testRouter(file);
		}

		console.log('\n✅ Todos los routers pasaron la prueba');
	} catch (error) {
		console.error('\n💥 Error durante las pruebas:', error);
		process.exit(1);
	}
}

main();
