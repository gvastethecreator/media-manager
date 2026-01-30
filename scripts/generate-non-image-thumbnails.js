#!/usr/bin/env node

/**
 * Script para generar thumbnails para todos los archivos no-imagen
 * (audio, documentos, JSON, 3D models)
 */

import process from 'node:process';

async function generateNonImageThumbnails() {
	try {
		console.log('🚀 Generando thumbnails para archivos no-imagen...\n');

		const { db } = await import('../src/lib/drizzle/index.js');
		const { audios, documents, jsonFiles, file3Ds } = await import('../src/lib/drizzle/schema/index.js');
		const { eq } = await import('drizzle-orm');

		// Importar procesadores
		const { AudioProcessor } = await import('../src/services/file-entity-mapper/processors/audio.processor.js');
		const { DocumentProcessor } = await import('../src/services/file-entity-mapper/processors/document.processor.js');
		const { JsonProcessor } = await import('../src/services/file-entity-mapper/processors/json.processor.js');
		const { File3DProcessor } = await import('../src/services/file-entity-mapper/processors/file3d.processor.js');

		const audioProcessor = new AudioProcessor();
		const documentProcessor = new DocumentProcessor();
		const jsonProcessor = new JsonProcessor();
		const file3DProcessor = new File3DProcessor();

		// Procesar audios
		console.log('🎵 Procesando audios...');
		const allAudios = await db.select({ id: audios.id, path: audios.path, name: audios.name }).from(audios);
		let audioSuccess = 0;
		let audioErrors = 0;

		for (const audio of allAudios) {
			try {
				const result = await audioProcessor.generateThumbnail(audio.path, audio.id);
				if (result.success) {
					console.log(`  ✅ ${audio.name}`);
					audioSuccess++;
				} else {
					console.log(`  ❌ ${audio.name}: ${result.error}`);
					audioErrors++;
				}
			} catch (error) {
				console.log(`  ❌ ${audio.name}: ${error.message}`);
				audioErrors++;
			}
		}
		console.log(`   📊 Audios: ${audioSuccess} exitosos, ${audioErrors} errores\n`);

		// Procesar documentos
		console.log('📄 Procesando documentos...');
		const allDocuments = await db
			.select({ id: documents.id, path: documents.path, name: documents.name })
			.from(documents);
		let documentSuccess = 0;
		let documentErrors = 0;

		for (const doc of allDocuments) {
			try {
				const result = await documentProcessor.generateThumbnail(doc.path, doc.id);
				if (result.success) {
					console.log(`  ✅ ${doc.name}`);
					documentSuccess++;
				} else {
					console.log(`  ❌ ${doc.name}: ${result.error}`);
					documentErrors++;
				}
			} catch (error) {
				console.log(`  ❌ ${doc.name}: ${error.message}`);
				documentErrors++;
			}
		}
		console.log(`   📊 Documentos: ${documentSuccess} exitosos, ${documentErrors} errores\n`);

		// Procesar JSON files
		console.log('📋 Procesando JSON files...');
		const allJsonFiles = await db
			.select({ id: jsonFiles.id, path: jsonFiles.path, name: jsonFiles.name })
			.from(jsonFiles);
		let jsonSuccess = 0;
		let jsonErrors = 0;

		for (const json of allJsonFiles) {
			try {
				const result = await jsonProcessor.generateThumbnail(json.path, json.id);
				if (result.success) {
					console.log(`  ✅ ${json.name}`);
					jsonSuccess++;
				} else {
					console.log(`  ❌ ${json.name}: ${result.error}`);
					jsonErrors++;
				}
			} catch (error) {
				console.log(`  ❌ ${json.name}: ${error.message}`);
				jsonErrors++;
			}
		}
		console.log(`   📊 JSON files: ${jsonSuccess} exitosos, ${jsonErrors} errores\n`);

		// Procesar 3D models
		console.log('🎨 Procesando modelos 3D...');
		const all3DModels = await db.select({ id: file3Ds.id, path: file3Ds.path, name: file3Ds.name }).from(file3Ds);
		let file3DSuccess = 0;
		let file3DErrors = 0;

		for (const model of all3DModels) {
			try {
				const result = await file3DProcessor.generateThumbnail(model.path, model.id);
				if (result.success) {
					console.log(`  ✅ ${model.name}`);
					file3DSuccess++;
				} else {
					console.log(`  ❌ ${model.name}: ${result.error}`);
					file3DErrors++;
				}
			} catch (error) {
				console.log(`  ❌ ${model.name}: ${error.message}`);
				file3DErrors++;
			}
		}
		console.log(`   📊 Modelos 3D: ${file3DSuccess} exitosos, ${file3DErrors} errores\n`);

		// Resumen
		const totalSuccess = audioSuccess + documentSuccess + jsonSuccess + file3DSuccess;
		const totalErrors = audioErrors + documentErrors + jsonErrors + file3DErrors;
		const totalProcessed = totalSuccess + totalErrors;

		console.log('🏁 Resumen:');
		console.log(`   Total procesados: ${totalProcessed}`);
		console.log(`   Exitosos: ${totalSuccess}`);
		console.log(`   Errores: ${totalErrors}`);
		console.log(
			`   Tasa de éxito: ${totalProcessed > 0 ? `${((totalSuccess / totalProcessed) * 100).toFixed(1)}%` : '0%'}`
		);
		console.log('\n✅ Script completado\n');
	} catch (error) {
		console.error('❌ Error al generar thumbnails:', error);
		process.exit(1);
	}
}

generateNonImageThumbnails();
