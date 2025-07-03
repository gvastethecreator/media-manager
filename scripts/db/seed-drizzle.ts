#!/usr/bin/env tsx

/**
 * Script ejecutable para seeds de Drizzle
 * Ejecuta las seeds desde el directorio scripts/db
 */

import { runSeeds } from '../../src/lib/drizzle/seeds/index';

async function main() {
	try {
		console.log('🌱 Ejecutando seeds de Drizzle...');
		await runSeeds();
		console.log('✅ Seeds completadas exitosamente');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error ejecutando seeds:', error);
		process.exit(1);
	}
}

main();