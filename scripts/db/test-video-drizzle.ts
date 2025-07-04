/**
 * Script de prueba para VideoService con Drizzle ORM
 * Verifica que los métodos de lectura funcionan correctamente
 */

import { count, eq } from 'drizzle-orm';
import { db } from '../../src/lib/drizzle';
import { folders, videos } from '../../src/lib/drizzle/schema';

async function testVideoService() {
	console.log('🎬 Iniciando pruebas de VideoService con Drizzle...\n');

	try {
		// Test 1: Contar videos totales
		console.log('📊 Test 1: Contando videos totales...');
		const totalVideos = await db.select({ count: count() }).from(videos);
		console.log(`   ✅ Total de videos: ${totalVideos[0]?.count || 0}\n`);

		// Test 2: Obtener primeros 5 videos con información de folder
		console.log('📋 Test 2: Obteniendo primeros 5 videos...');
		const videosList = await db
			.select({
				id: videos.id,
				name: videos.name,
				path: videos.path,
				size: videos.size,
				duration: videos.duration,
				width: videos.width,
				height: videos.height,
				isFavorite: videos.isFavorite,
				folderId: videos.folderId,
				createdAt: videos.createdAt,
				// Datos del folder
				folder: {
					id: folders.id,
					name: folders.name,
					path: folders.path,
				},
			})
			.from(videos)
			.leftJoin(folders, eq(videos.folderId, folders.id))
			.limit(5);

		console.log(`   ✅ Videos obtenidos: ${videosList.length}`);
		videosList.forEach((video, index) => {
			console.log(`   ${index + 1}. ${video.name}`);
			console.log(`      📁 Folder: ${video.folder?.name || 'Sin folder'}`);
			console.log(`      📏 Tamaño: ${(video.size / 1024 / 1024).toFixed(2)} MB`);
			console.log(`      ⏱️ Duración: ${video.duration ? `${video.duration}s` : 'N/A'}`);
			console.log(`      📐 Dimensiones: ${video.width && video.height ? `${video.width}x${video.height}` : 'N/A'}`);
			console.log(`      ⭐ Favorito: ${video.isFavorite ? 'Sí' : 'No'}\n`);
		});

		// Test 3: Obtener video específico por ID (si existe)
		if (videosList.length > 0) {
			const firstVideo = videosList[0];
			console.log('🔍 Test 3: Obteniendo video específico por ID...');

			const specificVideo = await db
				.select({
					id: videos.id,
					name: videos.name,
					description: videos.description,
					path: videos.path,
					hash: videos.hash,
					size: videos.size,
					duration: videos.duration,
					width: videos.width,
					height: videos.height,
					metadata: videos.metadata,
					thumbnail: videos.thumbnail,
					isPublic: videos.isPublic,
					isFavorite: videos.isFavorite,
					folderId: videos.folderId,
					createdAt: videos.createdAt,
					updatedAt: videos.updatedAt,
					folder: {
						id: folders.id,
						name: folders.name,
						path: folders.path,
					},
				})
				.from(videos)
				.leftJoin(folders, eq(videos.folderId, folders.id))
				.where(eq(videos.id, firstVideo.id))
				.limit(1);

			if (specificVideo.length > 0) {
				const video = specificVideo[0];
				console.log(`   ✅ Video encontrado: ${video.name}`);
				console.log(`   📝 Descripción: ${video.description || 'Sin descripción'}`);
				console.log(`   🔗 Hash: ${video.hash}`);
				console.log(`   🌐 Público: ${video.isPublic ? 'Sí' : 'No'}`);
				console.log(`   📅 Creado: ${video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'N/A'}`);
			} else {
				console.log('   ❌ Video no encontrado');
			}
		}

		// Test 4: Probar filtros básicos
		console.log('\n🔍 Test 4: Probando filtros básicos...');

		// Videos favoritos
		const favoriteVideos = await db.select({ count: count() }).from(videos).where(eq(videos.isFavorite, true));
		console.log(`   ⭐ Videos favoritos: ${favoriteVideos[0]?.count || 0}`);

		// Videos públicos
		const publicVideos = await db.select({ count: count() }).from(videos).where(eq(videos.isPublic, true));
		console.log(`   🌐 Videos públicos: ${publicVideos[0]?.count || 0}`);

		console.log('\n🎉 ¡Todas las pruebas de VideoService completadas exitosamente!');
		console.log('\n📈 Resumen:');
		console.log(`   • Total de videos: ${totalVideos[0]?.count || 0}`);
		console.log(`   • Videos favoritos: ${favoriteVideos[0]?.count || 0}`);
		console.log(`   • Videos públicos: ${publicVideos[0]?.count || 0}`);
		console.log('   • Consultas con JOIN funcionando: ✅');
		console.log('   • Filtros básicos funcionando: ✅');
	} catch (error) {
		console.error('❌ Error en las pruebas de VideoService:', error);
		console.error('Detalles del error:', error instanceof Error ? error.message : 'Error desconocido');
		process.exit(1);
	}
}

// Ejecutar las pruebas
testVideoService()
	.then(() => {
		console.log('\n✅ Script de pruebas completado');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Error fatal:', error);
		process.exit(1);
	});
