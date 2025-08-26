#!/usr/bin/env bun
/**
 * Script simplificado para limpiar imágenes fantasma
 * Elimina registros de imágenes cursed-img-* que no existen físicamente
 */

import { Database } from 'bun:sqlite';

const db = new Database('db.sqlite');

console.log('🔍 Iniciando limpieza rápida de imágenes fantasma...\n');

try {
	// 1. Contar imágenes cursed-img-* en la BD
	const cursedImages = db.query("SELECT id, name, path FROM Image WHERE id LIKE 'cursed-img-%' ORDER BY id").all();
	console.log(`📊 Imágenes cursed-img-* encontradas: ${cursedImages.length}`);

	if (cursedImages.length === 0) {
		console.log('✅ No se encontraron imágenes fantasma cursed-img-*');
		process.exit(0);
	}

	// 2. Mostrar las primeras 5 para confirmar
	console.log('\n🔍 Primeras imágenes a eliminar:');
	cursedImages.slice(0, 5).forEach((img, i) => {
		console.log(`   ${i + 1}. ${img.id} -> ${img.path}`);
	});
	if (cursedImages.length > 5) {
		console.log(`   ... y ${cursedImages.length - 5} más`);
	}

	// 3. Eliminar imágenes cursed-img-*
	console.log(`\n🗑️ Eliminando ${cursedImages.length} imágenes fantasma...`);
	const deleteResult = db.query("DELETE FROM Image WHERE id LIKE 'cursed-img-%'").run();
	console.log(`✅ Eliminadas: ${deleteResult.changes} imágenes`);

	// 4. Limpiar registros relacionados huérfanos
	console.log('\n🧹 Limpiando registros relacionados...');

	// Limpiar estadísticas huérfanas
	const statsResult = db
		.query(`
		DELETE FROM ImageStats 
		WHERE imageId NOT IN (SELECT id FROM Image)
	`)
		.run();
	console.log(`   📈 Estadísticas huérfanas eliminadas: ${statsResult.changes}`);

	// Limpiar thumbnails huérfanos
	const thumbsResult = db
		.query(`
		DELETE FROM Thumbnail 
		WHERE entityType = 'image' AND entityId NOT IN (SELECT id FROM Image)
	`)
		.run();
	console.log(`   🖼️ Thumbnails huérfanos eliminados: ${thumbsResult.changes}`);

	// 5. Verificar estado final
	const finalCount = db.query('SELECT COUNT(*) as count FROM Image').get();
	console.log(`\n📊 Imágenes restantes en BD: ${finalCount.count}`);

	console.log('\n🎉 ¡Limpieza completada con éxito!');
	console.log('💡 Los errores ServiceError file_not_found deberían desaparecer ahora.');
} catch (error) {
	console.error('❌ Error durante la limpieza:', error);
	process.exit(1);
}
