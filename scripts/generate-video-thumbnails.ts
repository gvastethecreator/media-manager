/**
 * Script para generar thumbnails de videos que no los tienen
 * Uso: bun run scripts/generate-video-thumbnails.ts
 */

import { eq, isNull } from 'drizzle-orm';
import { db } from '../src/lib/drizzle';
import { videos } from '../src/lib/drizzle/schema';
import { generateStaticVideoThumbnailFFmpeg } from '../src/lib/utils/video/ffmpeg-thumbnails';

const BATCH_SIZE = 5; // Procesar de 5 en 5 para no sobrecargar

async function generateMissingThumbnails() {
	console.log('🔍 Buscando videos sin thumbnail...');

	// Obtener videos sin thumbnail
	const videosWithoutThumbnail = await db
		.select({
			id: videos.id,
			name: videos.name,
			path: videos.path,
		})
		.from(videos)
		.where(isNull(videos.thumbnail));

	console.log(`🎬 Encontrados ${videosWithoutThumbnail.length} videos sin thumbnail`);

	if (videosWithoutThumbnail.length === 0) {
		console.log('✅ Todos los videos ya tienen thumbnails');
		return;
	}

	let processed = 0;
	let errors = 0;

	// Procesar en batches
	for (let i = 0; i < videosWithoutThumbnail.length; i += BATCH_SIZE) {
		const batch = videosWithoutThumbnail.slice(i, i + BATCH_SIZE);
		console.log(
			`\n📦 Procesando batch ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(videosWithoutThumbnail.length / BATCH_SIZE)}`
		);

		await Promise.all(
			batch.map(async (video) => {
				try {
					console.log(`  🎬 Generando thumbnail para: ${video.name}`);

					const thumbnailBuffer = await generateStaticVideoThumbnailFFmpeg(video.path, {
						time: 1,
						width: 320,
						height: 240,
						quality: 'medium',
					});

					if (thumbnailBuffer) {
						await db
							.update(videos)
							.set({
								thumbnail: thumbnailBuffer.toString('base64'),
								thumbnailSize: thumbnailBuffer.length,
								thumbnailWidth: 320,
								thumbnailHeight: 240,
								updatedAt: new Date(),
							})
							.where(eq(videos.id, video.id));

						console.log(`  ✅ Thumbnail generado: ${video.name}`);
						processed++;
					} else {
						console.log(`  ❌ No se pudo generar thumbnail: ${video.name}`);
						errors++;
					}
				} catch (error) {
					console.error(`  ❌ Error generando thumbnail para ${video.name}:`, error);
					errors++;
				}
			})
		);

		// Pequeña pausa entre batches para no saturar
		if (i + BATCH_SIZE < videosWithoutThumbnail.length) {
			console.log('⏳ Pausa de 1 segundo...');
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	console.log('\n📊 Resumen:');
	console.log(`  ✅ Procesados exitosamente: ${processed}`);
	console.log(`  ❌ Errores: ${errors}`);
	console.log(`  📊 Total: ${videosWithoutThumbnail.length}`);
}

// Ejecutar
console.log('🚀 Iniciando generación de thumbnails para videos...\n');
generateMissingThumbnails()
	.then(() => {
		console.log('\n✨ Script completado');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n💥 Error fatal:', error);
		process.exit(1);
	});
