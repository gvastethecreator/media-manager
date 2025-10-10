import { Database } from 'bun:sqlite';
import { join } from 'node:path';

// Ejecutar desde la raíz del proyecto
const dbPath = join(import.meta.dir, '..', 'db.sqlite');
const db = new Database(dbPath);

// Solo crear índices que no existan
const indexes = [
	// Images - ya tienen algunos, agregar faltantes si no existen
	'CREATE INDEX IF NOT EXISTS Image_isFavorite_idx ON Image (isFavorite)',
	'CREATE INDEX IF NOT EXISTS Image_aiEngine_idx ON Image (aiEngine)',
	'CREATE INDEX IF NOT EXISTS Image_aiOriginDetected_idx ON Image (aiOriginDetected)',

	// Collections - índices básicos
	'CREATE INDEX IF NOT EXISTS Collection_isFavorite_idx ON Collection (isFavorite)',
	'CREATE INDEX IF NOT EXISTS Collection_lastImageAddedAt_idx ON Collection (lastImageAddedAt)',

	// Folders - índices adicionales
	'CREATE INDEX IF NOT EXISTS Folder_isFavorite_idx ON Folder (isFavorite)',
	'CREATE INDEX IF NOT EXISTS Folder_totalFiles_idx ON Folder (totalFiles)',

	// Tags - índices básicos
	'CREATE INDEX IF NOT EXISTS Tag_isFavorite_idx ON Tag (isFavorite)',

	// Files - índices de estado y favoritos
	'CREATE INDEX IF NOT EXISTS File_isFavorite_idx ON File (isFavorite)',
	'CREATE INDEX IF NOT EXISTS File_processingStatus_idx ON File (processingStatus)',

	// Videos - índices básicos
	'CREATE INDEX IF NOT EXISTS Video_isFavorite_idx ON Video (isFavorite)',

	// Group pivot tables - acelerar joins
	'CREATE INDEX IF NOT EXISTS _GroupToImage_A_idx ON _GroupToImage (A)',
	'CREATE INDEX IF NOT EXISTS _GroupToImage_B_idx ON _GroupToImage (B)',
	'CREATE INDEX IF NOT EXISTS _GroupToVideo_A_idx ON _GroupToVideo (A)',
	'CREATE INDEX IF NOT EXISTS _GroupToVideo_B_idx ON _GroupToVideo (B)',
	'CREATE INDEX IF NOT EXISTS _GroupToAlbum_A_idx ON _GroupToAlbum (A)',
	'CREATE INDEX IF NOT EXISTS _GroupToTag_A_idx ON _GroupToTag (A)',

	// Character pivot tables
	'CREATE INDEX IF NOT EXISTS _ImageToCharacter_A_idx ON _ImageToCharacter (A)',
	'CREATE INDEX IF NOT EXISTS _ImageToCharacter_B_idx ON _ImageToCharacter (B)',
	'CREATE INDEX IF NOT EXISTS _VideoToCharacter_A_idx ON _VideoToCharacter (A)',
	'CREATE INDEX IF NOT EXISTS _VideoToCharacter_B_idx ON _VideoToCharacter (B)',

	// Otras pivot tables importantes
	'CREATE INDEX IF NOT EXISTS _ImageToTag_A_idx ON _ImageToTag (A)',
	'CREATE INDEX IF NOT EXISTS _ImageToTag_B_idx ON _ImageToTag (B)',
];

try {
	console.log('📊 Aplicando índices de performance...\n');

	let created = 0;
	let skipped = 0;

	for (const sql of indexes) {
		try {
			db.exec(sql);
			created++;
			console.log(`✓ ${sql.match(/INDEX IF NOT EXISTS (\w+)/)[1]}`);
		} catch (error) {
			if (error.message.includes('already exists')) {
				skipped++;
			} else {
				console.warn(`⚠ Error: ${error.message}`);
			}
		}
	}

	console.log(`\n✅ Aplicados ${created} índices, ${skipped} ya existían\n`);

	// Optimizar base de datos
	console.log('🔧 Optimizando base de datos...');
	db.exec('ANALYZE');
	console.log('✅ Análisis completado\n');
} catch (error) {
	console.error('❌ Error aplicando índices:', error);
	process.exit(1);
} finally {
	db.close();
}
