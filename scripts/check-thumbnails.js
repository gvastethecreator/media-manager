#!/usr/bin/env node

/**
 * Script para verificar el estado de thumbnails de todos los archivos no-imagen
 */

async function checkThumbnailStatus() {
	try {
		console.log('🔍 Verificando estado de thumbnails...\n');

		const { db } = await import('../src/lib/drizzle/index.js');
		const { videos, audios, documents, jsonFiles, file3Ds, metadatas } = await import(
			'../src/lib/drizzle/schema/index.js'
		);
		const { eq, and, isNull } = await import('drizzle-orm');

		// Verificar videos
		console.log('📹 Videos:');
		const allVideos = await db
			.select({ id: videos.id, name: videos.name, hasThumbnail: videos.thumbnail })
			.from(videos);
		const videosWithThumbnails = allVideos.filter((v) => v.hasThumbnail !== null).length;
		const videosWithoutThumbnails = allVideos.length - videosWithThumbnails;
		console.log(`   Total: ${allVideos.length}`);
		console.log(`   ✓ Con thumbnails: ${videosWithThumbnails}`);
		console.log(`   ✗ Sin thumbnails: ${videosWithoutThumbnails}\n`);

		// Verificar audios
		console.log('🎵 Audios:');
		const allAudios = await db.select({ id: audios.id, name: audios.name }).from(audios);
		const audioIds = allAudios.map((a) => a.id);
		let audiosWithThumbnails = 0;
		if (audioIds.length > 0) {
			// Check metadata.waveform field
			for (const audio of allAudios) {
				const fullAudio = await db
					.select({ metadata: audios.metadata })
					.from(audios)
					.where(eq(audios.id, audio.id))
					.limit(1);
				if (fullAudio.length > 0) {
					const metadata = fullAudio[0]?.metadata
						? typeof fullAudio[0].metadata === 'string'
							? JSON.parse(fullAudio[0].metadata)
							: fullAudio[0].metadata
						: {};
					if (metadata?.waveform) {
						audiosWithThumbnails++;
					}
				}
			}
		}
		const audiosWithoutThumbnails = allAudios.length - audiosWithThumbnails;
		console.log(`   Total: ${allAudios.length}`);
		console.log(`   ✓ Con thumbnails: ${audiosWithThumbnails}`);
		console.log(`   ✗ Sin thumbnails: ${audiosWithoutThumbnails}\n`);

		// Verificar documentos (thumbnails en metadatas table)
		console.log('📄 Documentos:');
		const allDocuments = await db
			.select({
				id: documents.id,
				name: documents.name,
			})
			.from(documents);
		const documentIds = allDocuments.map((d) => d.id);
		let documentsWithThumbnails = 0;
		if (documentIds.length > 0) {
			const docThumbnails = await db
				.select()
				.from(metadatas)
				.where(and(eq(metadatas.entityType, 'document'), eq(metadatas.key, 'thumbnail')));
			documentsWithThumbnails = docThumbnails.length;
		}
		const documentsWithoutThumbnails = allDocuments.length - documentsWithThumbnails;
		console.log(`   Total: ${allDocuments.length}`);
		console.log(`   ✓ Con thumbnails: ${documentsWithThumbnails}`);
		console.log(`   ✗ Sin thumbnails: ${documentsWithoutThumbnails}\n`);

		// Verificar JSON files (thumbnails en metadata field)
		console.log('📋 JSON Files:');
		const allJsonFiles = await db.select({ id: jsonFiles.id, name: jsonFiles.name }).from(jsonFiles);
		let jsonsWithThumbnails = 0;
		if (allJsonFiles.length > 0) {
			// Check metadata.thumbnail field
			for (const jsonFile of allJsonFiles) {
				const fullJsonFile = await db
					.select({ metadata: jsonFiles.metadata })
					.from(jsonFiles)
					.where(eq(jsonFiles.id, jsonFile.id))
					.limit(1);
				if (fullJsonFile.length > 0) {
					const metadata = fullJsonFile[0]?.metadata
						? typeof fullJsonFile[0].metadata === 'string'
							? JSON.parse(fullJsonFile[0].metadata)
							: fullJsonFile[0].metadata
						: {};
					if (metadata?.thumbnail) {
						jsonsWithThumbnails++;
					}
				}
			}
		}
		const jsonsWithoutThumbnails = allJsonFiles.length - jsonsWithThumbnails;
		console.log(`   Total: ${allJsonFiles.length}`);
		console.log(`   ✓ Con thumbnails: ${jsonsWithThumbnails}`);
		console.log(`   ✗ Sin thumbnails: ${jsonsWithoutThumbnails}\n`);

		// Verificar 3D files (thumbnails en metadata field)
		console.log('🎨 3D Models:');
		const all3DFiles = await db.select({ id: file3Ds.id, name: file3Ds.name }).from(file3Ds);
		let files3DWithThumbnails = 0;
		if (all3DFiles.length > 0) {
			// Check metadata.thumbnail field
			for (const file3d of all3DFiles) {
				const full3DFile = await db
					.select({ metadata: file3Ds.metadata })
					.from(file3Ds)
					.where(eq(file3Ds.id, file3d.id))
					.limit(1);
				if (full3DFile.length > 0) {
					const metadata = full3DFile[0]?.metadata
						? typeof full3DFile[0].metadata === 'string'
							? JSON.parse(full3DFile[0].metadata)
							: full3DFile[0].metadata
						: {};
					if (metadata?.thumbnail) {
						files3DWithThumbnails++;
					}
				}
			}
		}
		const files3DWithoutThumbnails = all3DFiles.length - files3DWithThumbnails;
		console.log(`   Total: ${all3DFiles.length}`);
		console.log(`   ✓ Con thumbnails: ${files3DWithThumbnails}`);
		console.log(`   ✗ Sin thumbnails: ${files3DWithoutThumbnails}\n`);

		console.log('✅ Verificación completada\n');
	} catch (error) {
		console.error('❌ Error al verificar thumbnails:', error);
		process.exit(1);
	}
}

checkThumbnailStatus();
