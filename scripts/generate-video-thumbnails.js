#!/usr/bin/env node

/**
 * Script para generar thumbnails pre-generados para todos los videos existentes
 * que no tengan thumbnail en la columna 'thumbnail' de la base de datos.
 *
 * Uso: node scripts/generate-video-thumbnails.js [--force] [--concurrency=N]
 *
 * Opciones:
 * --force: Regenerar thumbnails incluso si ya existen
 * --concurrency=N: Número de videos a procesar en paralelo (default: 3)
 */

import { existsSync } from 'node:fs';
import process from 'node:process';

async function generateVideoThumbnails() {
	try {
		console.log('🚀 Iniciando generación de thumbnails para videos...');

		// Parsear argumentos
		const args = process.argv.slice(2);
		const forceRegenerate = args.includes('--force');
		const concurrencyArg = args.find((arg) => arg.startsWith('--concurrency='));
		const concurrency = concurrencyArg ? Number.parseInt(concurrencyArg.split('=')[1], 10) || 3 : 3;

		console.log('⚙️ Configuración:', {
			forceRegenerate,
			concurrency,
		});

		// Importar dependencias necesarias
		const { db } = await import('../src/lib/drizzle/index.js');
		const { videos } = await import('../src/lib/drizzle/schema/index.js');
		const { generateAnimatedVideoThumbnail, generateStaticVideoThumbnail } = await import(
			'../src/lib/utils/video/helpers.js'
		);
		const { isNull, not, eq } = await import('drizzle-orm');
		const PQueue = (await import('p-queue')).default;

		// Obtener videos que necesitan thumbnails
		let videosToProcess;
		if (forceRegenerate) {
			videosToProcess = await db
				.select({
					id: videos.id,
					name: videos.name,
					path: videos.path,
					thumbnail: videos.thumbnail,
				})
				.from(videos);
		} else {
			videosToProcess = await db
				.select({
					id: videos.id,
					name: videos.name,
					path: videos.path,
					thumbnail: videos.thumbnail,
				})
				.from(videos)
				.where(isNull(videos.thumbnail));
		}

		if (videosToProcess.length === 0) {
			console.log('✅ Todos los videos ya tienen thumbnails generados');
			return;
		}

		console.log(`📹 Encontrados ${videosToProcess.length} videos para procesar`);

		// Configurar cola de procesamiento
		const queue = new PQueue({ concurrency });
		const results = {
			processed: 0,
			successful: 0,
			errors: 0,
			skipped: 0,
		};

		// Procesar cada video
		const tasks = videosToProcess.map((video) =>
			queue.add(async () => {
				results.processed++;

				try {
					console.log(`🔄 [${results.processed}/${videosToProcess.length}] Procesando: ${video.name}`);

					// Verificar que el archivo existe
					if (!existsSync(video.path)) {
						console.warn(`⚠️ Archivo no encontrado: ${video.path}`);
						results.skipped++;
						return;
					}

					// Generar WebP animado (o estático como fallback)
					let animatedWebpBuffer = await generateAnimatedVideoThumbnail(video.path, {
						time: 1,
						quality: 'medium',
						frames: 4,
						duration: 1.5,
					});

					// Si falló el animado, intentar con thumbnail estático
					if (!animatedWebpBuffer || animatedWebpBuffer.length === 0) {
						console.log(`⚠️ GIF animado falló, intentando estático: ${video.name}`);
						animatedWebpBuffer = await generateStaticVideoThumbnail(video.path, {
							time: 1,
							quality: 'medium',
							width: 320,
							height: 240,
						});
					}

					if (!animatedWebpBuffer || animatedWebpBuffer.length === 0) {
						console.warn(`❌ No se pudo generar thumbnail para: ${video.name} (ambos métodos fallaron)`);
						results.errors++;
						return;
					}

					// Convertir a base64
					const b64 = animatedWebpBuffer.toString('base64');

					// Obtener dimensiones usando Sharp
					let thumbnailWidth = null;
					let thumbnailHeight = null;

					try {
						const sharp = await import('sharp');
						const metadata = await sharp.default(animatedWebpBuffer).metadata();
						thumbnailWidth = metadata.width || null;
						thumbnailHeight = metadata.height || null;
					} catch (e) {
						console.warn(`⚠️ No se pudieron obtener dimensiones para: ${video.name}`, e.message);
					}

					// Actualizar en la base de datos
					await db
						.update(videos)
						.set({
							thumbnail: b64,
							thumbnailSize: animatedWebpBuffer.length,
							thumbnailWidth,
							thumbnailHeight,
							thumbnailMimeType: 'image/webp',
							updatedAt: new Date(),
						})
						.where(eq(videos.id, video.id));

					console.log(`✅ Thumbnail generado para: ${video.name} (${Math.round(animatedWebpBuffer.length / 1024)}KB)`);
					results.successful++;
				} catch (error) {
					console.error(`❌ Error procesando ${video.name}:`, error.message);
					results.errors++;
				}
			})
		);

		// Esperar a que terminen todas las tareas
		await Promise.all(tasks);

		// Mostrar resumen
		console.log('📊 Resumen de procesamiento:', {
			total: videosToProcess.length,
			successful: results.successful,
			errors: results.errors,
			skipped: results.skipped,
			successRate: `${Math.round((results.successful / videosToProcess.length) * 100)}%`,
		});

		if (results.successful > 0) {
			console.log(`🎉 Se generaron ${results.successful} thumbnails exitosamente`);
		}

		if (results.errors > 0) {
			console.warn(`⚠️ Se encontraron ${results.errors} errores durante el procesamiento`);
		}

		if (results.skipped > 0) {
			console.log(`ℹ️ Se saltaron ${results.skipped} videos (archivo no encontrado)`);
		}
	} catch (error) {
		console.error('💥 Error fatal en el script:', error);
		process.exit(1);
	}
}

// Ejecutar el script
generateVideoThumbnails()
	.then(() => {
		console.log('🏁 Script completado exitosamente');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 El script terminó con errores:', error);
		process.exit(1);
	});
