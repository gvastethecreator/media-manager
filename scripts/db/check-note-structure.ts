import { db } from '../../src/lib/drizzle';

async function checkNoteStructure() {
	try {
		console.log('🔍 Revisando estructura de la tabla Note...\n');

		const result = await db.run('PRAGMA table_info(Note)');
		console.log('📋 Estructura de la tabla Note:', result);

		// También intentar obtener una nota para ver qué campos existen realmente
		const sampleNote = await db.run('SELECT * FROM Note LIMIT 1');
		console.log('\n📄 Ejemplo de nota:', sampleNote);
	} catch (error) {
		console.error('❌ Error:', error);
	}
}

checkNoteStructure();
