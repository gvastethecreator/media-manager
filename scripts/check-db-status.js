#!/usr/bin/env bun
/**
 * Script para verificar el estado de la base de datos
 */

import { Database } from 'bun:sqlite';

const db = new Database('db.sqlite');

console.log('📊 Estado actual de la base de datos:\n');

try {
	// Contar total de imágenes
	const totalImages = db.query('SELECT COUNT(*) as count FROM Image').get();
	console.log(`📸 Total de imágenes: ${totalImages.count}`);

	// Contar imágenes cursed-img-*
	const cursedImages = db.query("SELECT COUNT(*) as count FROM Image WHERE id LIKE 'cursed-img-%'").get();
	console.log(`👻 Imágenes fantasma cursed-img-*: ${cursedImages.count}`);

	// Mostrar algunas imágenes cursed para verificar
	if (cursedImages.count > 0) {
		console.log('\n🔍 Primeras imágenes cursed-img-*:');
		const samples = db.query("SELECT id, name, path FROM Image WHERE id LIKE 'cursed-img-%' ORDER BY id LIMIT 5").all();
		samples.forEach((img, i) => {
			console.log(`   ${i + 1}. ${img.id} -> ${img.path}`);
		});
	}

	// Contar estadísticas de imágenes
	const totalStats = db.query('SELECT COUNT(*) as count FROM ImageStats').get();
	console.log(`\n📈 Estadísticas de imágenes: ${totalStats.count}`);

	// Contar thumbnails
	const totalThumbs = db.query('SELECT COUNT(*) as count FROM Thumbnail').get();
	console.log(`🖼️ Thumbnails: ${totalThumbs.count}`);
} catch (error) {
	console.error('❌ Error consultando la BD:', error);
}
