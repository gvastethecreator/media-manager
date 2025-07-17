#!/usr/bin/env tsx

import { createClient } from '@libsql/client';

async function checkActivityTable() {
	const client = createClient({
		url: process.env.DATABASE_URL || 'file:./db.sqlite',
	});

	try {
		console.log('🔍 Verificando estructura de la tabla Activity...');

		const result = await client.execute('PRAGMA table_info(Activity)');
		console.log('📋 Columnas de la tabla Activity:');
		console.log(JSON.stringify(result.rows, null, 2));
	} catch (error) {
		console.error('❌ Error verificando tabla Activity:', error);
	} finally {
		client.close();
	}
}

checkActivityTable();
