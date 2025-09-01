#!/usr/bin/env bun
/**
 * Script de prueba para verificar que mediabunny funciona correctamente
 * para extraer metadata de video y audio
 */

import { existsSync } from 'fs';
import { join } from 'path';

// Importar los servicios
import {
	extractAudioMetadata,
	extractVideoMetadata,
} from './src/server/services/metadata/mediabunny-parser.service.ts';

async function testMediabunny() {
	console.log('🧪 Testing mediabunny integration...\n');

	// Buscar un archivo de video de prueba en test-files
	const testFilesDir = './test-files';
	let testVideoFile = null;
	let testAudioFile = null;

	if (existsSync(testFilesDir)) {
		const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
		const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

		const fs = require('fs');
		const files = fs.readdirSync(testFilesDir);

		// Buscar video de prueba
		for (const file of files) {
			const ext = require('path').extname(file).toLowerCase();
			if (videoExtensions.includes(ext) && !testVideoFile) {
				testVideoFile = join(testFilesDir, file);
				break;
			}
		}

		// Buscar audio de prueba
		for (const file of files) {
			const ext = require('path').extname(file).toLowerCase();
			if (audioExtensions.includes(ext) && !testAudioFile) {
				testAudioFile = join(testFilesDir, file);
				break;
			}
		}
	}

	// Test video metadata extraction
	if (testVideoFile) {
		console.log(`📹 Testing video metadata extraction: ${testVideoFile}`);
		try {
			const videoMetadata = await extractVideoMetadata(testVideoFile);
			console.log('✅ Video metadata extracted successfully:');
			console.log('   - Duration:', videoMetadata.duration?.toFixed(2), 'seconds');
			console.log('   - Dimensions:', `${videoMetadata.width}x${videoMetadata.height}`);
			console.log('   - Format:', videoMetadata.format);
			console.log('   - Codec:', videoMetadata.codec);
			console.log('   - Bitrate:', videoMetadata.bitrate);
			if (videoMetadata.thumbnail?.data) {
				console.log('   - Thumbnail: Generated', videoMetadata.thumbnail.data.length, 'bytes');
			}
			console.log();
		} catch (error) {
			console.error('❌ Video metadata extraction failed:', error.message);
			console.log();
		}
	} else {
		console.log('⚠️  No test video file found in ./test-files/\n');
	}

	// Test audio metadata extraction
	if (testAudioFile) {
		console.log(`🎵 Testing audio metadata extraction: ${testAudioFile}`);
		try {
			const audioMetadata = await extractAudioMetadata(testAudioFile);
			console.log('✅ Audio metadata extracted successfully:');
			console.log('   - Duration:', audioMetadata.duration?.toFixed(2), 'seconds');
			console.log('   - Format:', audioMetadata.format);
			console.log('   - Codec:', audioMetadata.codec);
			console.log('   - Bitrate:', audioMetadata.bitrate);
			console.log('   - Sample Rate:', audioMetadata.sampleRate);
			console.log('   - Channels:', audioMetadata.channels);
			console.log();
		} catch (error) {
			console.error('❌ Audio metadata extraction failed:', error.message);
			console.log();
		}
	} else {
		console.log('⚠️  No test audio file found in ./test-files/\n');
	}

	// Test con un archivo que sabemos que no existe
	console.log('🚫 Testing with non-existent file...');
	try {
		await extractVideoMetadata('./non-existent-file.mp4');
		console.log('❌ Should have thrown an error');
	} catch (error) {
		console.log('✅ Properly handled non-existent file:', error.message);
	}

	console.log('\n🎉 Mediabunny integration test completed!');
}

// Ejecutar test
testMediabunny().catch(console.error);
