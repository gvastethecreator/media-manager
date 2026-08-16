import { resolveDatabasePath } from './database-safety';
import { migrateDatabase } from './migrations';

console.log('🔧 Inicializando base de datos...');

try {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatorio; no se usará db.sqlite por fallback.');
	await migrateDatabase({ databasePath: resolveDatabasePath(process.env.DATABASE_URL) });
	console.log('✅ Base de datos inicializada correctamente');
} catch (error) {
	console.error('❌ Error al inicializar la base de datos:', error);
	process.exit(1);
}
