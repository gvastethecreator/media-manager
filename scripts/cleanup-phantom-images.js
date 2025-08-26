#!/usr/bin/env bun
/**
 * Script para limpiar imágenes fantasma de la base de datos
 * Elimina registros de imágenes que no existen físicamente
 */

import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

const db = new Database('db.sqlite');

async function cleanupPhantomImages() {
	console.log('🔍 Iniciando limpieza de imágenes fantasma...\n');

	try {
		// 1. Obtener todas las imágenes de la BD
		const allImages = db.query('SELECT id, name, path FROM Image ORDER BY id').all();
		console.log(`📊 Total de imágenes en BD: ${allImages.length}`);

		let phantomCount = 0;
		let validCount = 0;
		const phantomImages = [];

		// 2. Verificar cuáles existen físicamente
		for (const img of allImages) {
			// Convertir ruta relativa a absoluta
			let fullPath = img.path;

			// Si es ruta relativa (/examples/...), convertir a ruta absoluta
			if (img.path.startsWith('/examples/') || img.path.startsWith('/uploads/')) {
				fullPath = join(process.cwd(), 'public', img.path);
			}

			// Resolver rutas con barras invertidas (Windows)
			fullPath = resolve(fullPath);

			const exists = existsSync(fullPath);

			if (exists) {
				validCount++;
				console.log(`✅ EXISTS: ${img.id} -> ${img.name}`);
			} else {
				phantomCount++;
				phantomImages.push({
					id: img.id,
					name: img.name,
					path: img.path,
					fullPath,
				});
				console.log(`❌ PHANTOM: ${img.id} -> ${img.path}`);
			}
		}

		console.log('\n📈 Resumen de análisis:');
		console.log(`   ✅ Imágenes válidas: ${validCount}`);
		console.log(`   ❌ Imágenes fantasma: ${phantomCount}`);

		if (phantomCount === 0) {
			console.log('\n🎉 ¡No se encontraron imágenes fantasma! La BD está limpia.');
			return;
		}

		console.log(`\n🗑️ Eliminando ${phantomCount} imágenes fantasma...`);

		// 3. Eliminar imágenes fantasma de la BD
		let deletedCount = 0;
		for (const phantom of phantomImages) {
			try {
				const result = db.query('DELETE FROM Image WHERE id = ?').run(phantom.id);
				if (result.changes > 0) {
					deletedCount++;
					console.log(`🗑️ Eliminado: ${phantom.id} (${phantom.name})`);
				}
			} catch (error) {
				console.error(`❌ Error eliminando ${phantom.id}:`, error.message);
			}
		}

		console.log('\n✅ Limpieza completada:');
		console.log(`   🗑️ Imágenes eliminadas: ${deletedCount}`);
		console.log(`   ❌ Errores: ${phantomCount - deletedCount}`);

		// 4. Verificar estado final
		const finalCount = db.query('SELECT COUNT(*) as count FROM Image').get();
		console.log(`   📊 Imágenes restantes en BD: ${finalCount.count}`);

		// 5. Limpiar registros relacionados huérfanos
		console.log('\n🧹 Limpiando registros relacionados huérfanos...');

		// Limpiar estadísticas huérfanas
		const orphanedStats = db
			.query(`
			DELETE FROM ImageStats 
			WHERE imageId NOT IN (SELECT id FROM Image)
		`)
			.run();

		console.log(`   📈 Estadísticas huérfanas eliminadas: ${orphanedStats.changes}`);

		// Limpiar thumbnails huérfanos
		const orphanedThumbs = db
			.query(`
			DELETE FROM Thumbnail 
			WHERE entityType = 'image' AND entityId NOT IN (SELECT id FROM Image)
		`)
			.run();

		console.log(`   🖼️ Thumbnails huérfanos eliminados: ${orphanedThumbs.changes}`);

		console.log('\n🎉 ¡Limpieza completada con éxito!');
	} catch (error) {
		console.error('❌ Error durante la limpieza:', error);
		throw error;
	}
}

// Ejecutar si es llamado directamente
if (import.meta.main) {
	cleanupPhantomImages()
		.then(() => {
			console.log('\n✅ Script finalizado exitosamente');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Script falló:', error);
			process.exit(1);
		});
}
