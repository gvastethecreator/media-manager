#!/usr/bin/env node

/**
 * Script de prueba para validar la generación de thumbnails con mediabunny
 *
 * Uso: node scripts/test-mediabunny.js [video-file-path]
 */

import { existsSync } from 'node:fs';
import process from 'node:process';
import { generateAnimatedVideoThumbnail, generateStaticVideoThumbnail } from '../src/lib/utils/video/helpers.js';

async function testThumbnailGeneration() {
	try {
		// Usar archivo proporcionado o buscar uno de prueba
		const testFile = process.argv[2] || findTestVideo();

		if (!(testFile && existsSync(testFile))) {
			console.error('❌ No se encontró archivo de video para probar.');
			console.log('Uso: node scripts/test-mediabunny.js [ruta-del-video]');
			process.exit(1);
		}

		console.log(`🧪 Probando generación de thumbnails con: ${testFile}`);

		// Probar thumbnail estático
		console.log('\n1️⃣ Probando thumbnail estático...');
		const staticStart = Date.now();
		const staticThumbnail = await generateStaticVideoThumbnail(testFile, {
			time: 2,
			quality: 'medium',
			width: 320,
			height: 240,
		});

		if (staticThumbnail) {
			console.log(`✅ Thumbnail estático generado: ${staticThumbnail.length} bytes (${Date.now() - staticStart}ms)`);
		} else {
			console.log('❌ Falló thumbnail estático');
		}

		// Probar thumbnail animado
		console.log('\n2️⃣ Probando thumbnail animado...');
		const animatedStart = Date.now();
		const animatedThumbnail = await generateAnimatedVideoThumbnail(testFile, {
			time: 2,
			quality: 'medium',
			frames: 6,
			duration: 1.5,
		});

		if (animatedThumbnail) {
			console.log(`✅ Thumbnail animado generado: ${animatedThumbnail.length} bytes (${Date.now() - animatedStart}ms)`);
		} else {
			console.log('❌ Falló thumbnail animado');
		}

		// Resumen
		console.log('\n📊 Resumen:');
		console.log(`- Estático: ${staticThumbnail ? '✅ OK' : '❌ FALLÓ'}`);
		console.log(`- Animado: ${animatedThumbnail ? '✅ OK' : '❌ FALLÓ'}`);

		if (staticThumbnail || animatedThumbnail) {
			console.log('\n🎉 Al menos un método funciona correctamente');
			process.exit(0);
		} else {
			console.log('\n💥 Ambos métodos fallaron');
			process.exit(1);
		}
	} catch (error) {
		console.error('💥 Error fatal en el test:', error);
		process.exit(1);
	}
}

function findTestVideo() {
	const commonPaths = ['./test-files/sample.mp4', './content/videos/test.mp4', './public/test-video.mp4'];

	for (const path of commonPaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	return null;
}

// Ejecutar el test
testThumbnailGeneration();
