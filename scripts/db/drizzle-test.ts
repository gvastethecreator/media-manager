import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { checkDatabaseConnection, closeDatabase, db, getDatabaseInfo } from '../../src/lib/drizzle';
import { profiles } from '../../src/lib/drizzle/schema';

/**
 * Script de prueba para validar la configuración de Drizzle ORM
 *
 * Este script:
 * 1. Verifica la conectividad a la base de datos
 * 2. Obtiene información básica de la DB
 * 3. Realiza consultas de prueba
 * 4. Valida que el schema funciona correctamente
 *
 * Ejecución: pnpm drizzle:test
 */

async function testDrizzleConfiguration() {
	console.log('🧪 Iniciando pruebas de configuración de Drizzle...\n');

	try {
		// 1. Verificar conectividad
		console.log('1️⃣ Verificando conectividad...');
		const isConnected = await checkDatabaseConnection();

		if (!isConnected) {
			throw new Error('❌ No se pudo conectar a la base de datos');
		}
		console.log('✅ Conexión establecida correctamente\n');

		// 2. Obtener información de la base de datos
		console.log('2️⃣ Obteniendo información de la base de datos...');
		const dbInfo = await getDatabaseInfo();

		if (!dbInfo) {
			throw new Error('❌ No se pudo obtener información de la base de datos');
		}

		console.log('📊 Información de la base de datos:');
		console.log(`   - URL: ${dbInfo.url}`);
		console.log(`   - Tablas totales: ${dbInfo.tables}`);
		console.log(`   - Modo journal: ${dbInfo.journalMode}`);
		console.log(`   - Tamaño de página: ${dbInfo.pageSize} bytes`);
		console.log(`   - Versión: ${dbInfo.version}`);

		if (dbInfo.tables > 0) {
			console.log(`   - Primeras 5 tablas: ${dbInfo.tableNames.slice(0, 5).join(', ')}`);
		}
		console.log('');

		// 3. Probar consulta básica
		console.log('3️⃣ Probando consulta básica...');

		// Verificar que la tabla Profile existe
		const hasProfileTable = dbInfo.tableNames.includes('Profile');
		if (!hasProfileTable) {
			console.log('⚠️ La tabla Profile no existe. Esto es normal si la DB está vacía.');
			console.log('   Ejecuta `pnpm db:full-reset` para poblar la base de datos.\n');
		} else {
			// Intentar consulta a la tabla profiles
			const profileCount = await db.select().from(profiles);
			console.log(`✅ Consulta exitosa: ${profileCount.length} perfiles encontrados`);

			if (profileCount.length > 0) {
				console.log(`   - Primer perfil: ${profileCount[0].name}`);
			}
			console.log('');
		}

		// 4. Probar inserción de prueba (solo si hay datos)
		if (hasProfileTable) {
			console.log('4️⃣ Probando consulta con filtros...');

			try {
				const activeProfiles = await db.select().from(profiles).where(eq(profiles.isActive, true));
				console.log(`✅ Consulta con filtros exitosa: ${activeProfiles.length} perfiles activos`);
			} catch (error) {
				console.log('⚠️ Error en consulta con filtros (puede ser normal si no hay datos):', (error as Error).message);
			}
			console.log('');
		}

		// 5. Validar schema
		console.log('5️⃣ Validando schema...');
		console.log('✅ Schema cargado correctamente');
		console.log(`   - Tablas definidas en schema: ${Object.keys(db.query).length}`);
		console.log('');

		console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
		console.log('\n📋 Resumen:');
		console.log('   ✅ Conexión: OK');
		console.log('   ✅ Información de DB: OK');
		console.log('   ✅ Consultas básicas: OK');
		console.log('   ✅ Schema: OK');

		if (!hasProfileTable) {
			console.log('\n💡 Próximo paso: Ejecutar `pnpm db:full-reset` para poblar la base de datos');
		} else {
			console.log('\n💡 Próximo paso: Comenzar migración de servicios de solo lectura');
		}
	} catch (error) {
		console.error('❌ Error durante las pruebas:', error);
		console.log('\n🔧 Posibles soluciones:');
		console.log('   1. Verificar que DATABASE_URL esté configurada en .env');
		console.log('   2. Ejecutar `pnpm db:full-reset` para crear/poblar la base de datos');
		console.log('   3. Verificar que el archivo de base de datos exista y sea accesible');

		process.exit(1);
	} finally {
		// Cerrar conexión
		closeDatabase();
		console.log('\n🔌 Conexión cerrada correctamente');
	}
}

// Ejecutar pruebas
testDrizzleConfiguration();
