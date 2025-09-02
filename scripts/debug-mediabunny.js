#!/usr/bin/env node

/**
 * Script de prueba simplificado para debuggear mediabunny
 */

import { existsSync } from 'node:fs';
import process from 'node:process';

async function testMediabunnyDebug() {
	try {
		const testFile = process.argv[2] || 'test-files/test-video.mp4';

		if (!(testFile && existsSync(testFile))) {
			console.error('❌ No se encontró archivo de video para probar.');
			process.exit(1);
		}

		console.log(`🧪 Debugging mediabunny con: ${testFile}`);

		// Importar mediabunny dinámicamente
		const { Input, ALL_FORMATS, BlobSource } = await import('mediabunny');
		const { readFile } = await import('node:fs/promises');

		// Leer archivo como Blob
		console.log('📖 Leyendo archivo...');
		const fileBuffer = await readFile(testFile);
		console.log(`✅ Archivo leído: ${fileBuffer.length} bytes`);

		const blob = new Blob([new Uint8Array(fileBuffer)]);
		console.log(`✅ Blob creado: ${blob.size} bytes`);

		// Crear input de mediabunny
		console.log('🔍 Creando Input...');
		const input = new Input({
			source: new BlobSource(blob),
			formats: ALL_FORMATS,
		});
		console.log('✅ Input creado correctamente');

		// Obtener track de video
		console.log('🎬 Obteniendo video track...');
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			console.error('❌ No se encontró track de video');
			process.exit(1);
		}
		console.log(`✅ Video track encontrado: ${videoTrack.codec}`);

		// Verificar codec
		console.log(`🔧 Codec: ${videoTrack.codec}`);
		if (videoTrack.codec === null) {
			console.error('❌ Codec no soportado');
			process.exit(1);
		}

		// Verificar si se puede decodificar
		console.log('🔍 Verificando si se puede decodificar...');
		const canDecode = await videoTrack.canDecode();
		console.log(`🔍 canDecode result: ${canDecode}`);

		if (!canDecode) {
			console.error('❌ Track de video no se puede decodificar');

			// Información adicional de debug
			console.log(`Debug info:
			- displayWidth: ${videoTrack.displayWidth}
			- displayHeight: ${videoTrack.displayHeight}
			- codec: ${videoTrack.codec}
			- container: ${input.format?.name}
			`);

			process.exit(1);
		}

		console.log('✅ El video se puede decodificar');

		// Obtener duración
		console.log('⏱️ Calculando duración...');
		const totalDuration = await videoTrack.computeDuration();
		console.log(`✅ Duración: ${totalDuration} segundos`);

		// Obtener primer timestamp
		console.log('⏱️ Obteniendo primer timestamp...');
		const firstTimestamp = await videoTrack.getFirstTimestamp();
		console.log(`✅ Primer timestamp: ${firstTimestamp} segundos`);

		console.log('🎉 Todo funciona correctamente hasta aquí');
	} catch (error) {
		console.error('💥 Error fatal:', error);
		process.exit(1);
	}
}

// Ejecutar el test
testMediabunnyDebug();
