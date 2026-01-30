import { sql } from 'drizzle-orm';
import { db } from '../../src/lib/drizzle/index.js';

console.log('🔧 Inicializando base de datos...');

// Crear una consulta simple para inicializar la base de datos
try {
	await db.run(sql`SELECT 1`);
	console.log('✅ Base de datos inicializada correctamente');
} catch (error) {
	console.error('❌ Error al inicializar la base de datos:', error);
	process.exit(1);
}
