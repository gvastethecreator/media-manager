import { db } from '@/lib/drizzle';

/**
 * Test simple para verificar conexión y estructura de la base de datos
 */
async function testDrizzleConnection() {
	console.log('🔍 Probando conexión con Drizzle...');

	try {
		// Intentar una query simple
		const result = await db
			.select()
			.from({
				name: 'sqlite_master',
				columns: { type: 'text', name: 'text', tbl_name: 'text' },
			})
			.where({ type: 'table' });

		console.log('✅ Conexión exitosa');
		console.log(
			'📋 Tablas encontradas:',
			result.map((r) => r.tbl_name)
		);
		return result;
	} catch (error) {
		console.error('❌ Error de conexión:', error);
		throw error;
	}
}

testDrizzleConnection();
