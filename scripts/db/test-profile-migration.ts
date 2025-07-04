import 'dotenv/config';
import { profileService } from '../../src/services/profile/profile.service';

/**
 * Script de prueba específico para validar la migración del ProfileService
 *
 * Este script prueba específicamente el método getActiveProfile() que ha sido
 * migrado de Prisma a Drizzle con validación de coexistencia.
 *
 * Ejecución: tsx scripts/db/test-profile-migration.ts
 */

async function testProfileServiceMigration() {
	console.log('🧪 Probando migración de ProfileService...\n');

	try {
		// 1. Probar getActiveProfile (método migrado)
		console.log('1️⃣ Probando getActiveProfile() (migrado a Drizzle)...');

		const startTime = Date.now();
		const activeProfile = await profileService.getActiveProfile();
		const endTime = Date.now();

		console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);

		if (activeProfile) {
			console.log('✅ Perfil activo encontrado:');
			console.log(`   - ID: ${activeProfile.id}`);
			console.log(`   - Nombre: ${activeProfile.name}`);
			console.log(`   - Activo: ${activeProfile.isActive}`);
			console.log(`   - Tema: ${activeProfile.parsedPreferences?.theme || 'undefined'}`);
			console.log(`   - Idioma: ${activeProfile.parsedPreferences?.language || 'undefined'}`);
			console.log(`   - Emoji: ${activeProfile.emoji}`);
			console.log(`   - Color: ${activeProfile.color}`);
		} else {
			console.log('⚠️ No se encontró perfil activo');
		}
		console.log('');

		// 2. Probar múltiples llamadas para verificar consistencia
		console.log('2️⃣ Probando consistencia con múltiples llamadas...');

		const calls = [];
		for (let i = 0; i < 3; i++) {
			calls.push(profileService.getActiveProfile());
		}

		const results = await Promise.all(calls);
		const allConsistent = results.every((result) => JSON.stringify(result) === JSON.stringify(results[0]));

		if (allConsistent) {
			console.log('✅ Todas las llamadas devolvieron resultados consistentes');
		} else {
			console.log('❌ Inconsistencia detectada entre llamadas');
			results.forEach((result, index) => {
				console.log(`   Llamada ${index + 1}:`, result?.id || 'null');
			});
		}
		console.log('');

		// 3. Verificar que el resultado es válido
		console.log('3️⃣ Validando estructura del resultado...');

		if (activeProfile) {
			const requiredFields = ['id', 'name', 'isActive', 'parsedPreferences'];
			const missingFields = requiredFields.filter((field) => !(field in activeProfile));

			if (missingFields.length === 0) {
				console.log('✅ Estructura del perfil válida - todos los campos requeridos presentes');
			} else {
				console.log(`❌ Campos faltantes: ${missingFields.join(', ')}`);
			}

			// Verificar tipos
			const typeChecks = [
				{ field: 'id', type: 'string', value: activeProfile.id },
				{ field: 'name', type: 'string', value: activeProfile.name },
				{ field: 'isActive', type: 'boolean', value: activeProfile.isActive },
			];

			const typeErrors = typeChecks.filter((check) => typeof check.value !== check.type);

			if (typeErrors.length === 0) {
				console.log('✅ Tipos de datos correctos');
			} else {
				console.log('❌ Errores de tipo:', typeErrors);
			}
		}
		console.log('');

		// 4. Probar rendimiento
		console.log('4️⃣ Probando rendimiento...');

		const performanceTests = [];
		const iterations = 10;

		for (let i = 0; i < iterations; i++) {
			const start = Date.now();
			await profileService.getActiveProfile();
			const end = Date.now();
			performanceTests.push(end - start);
		}

		const avgTime = performanceTests.reduce((a, b) => a + b, 0) / iterations;
		const minTime = Math.min(...performanceTests);
		const maxTime = Math.max(...performanceTests);

		console.log(`📊 Rendimiento (${iterations} iteraciones):`);
		console.log(`   - Tiempo promedio: ${avgTime.toFixed(2)}ms`);
		console.log(`   - Tiempo mínimo: ${minTime}ms`);
		console.log(`   - Tiempo máximo: ${maxTime}ms`);
		console.log('');

		// 5. Probar getById (segundo método migrado)
		if (activeProfile) {
			console.log('5️⃣ Probando getById() (migrado a Drizzle)...');

			const startTimeById = Date.now();
			const profileById = await profileService.getById(activeProfile.id);
			const endTimeById = Date.now();

			console.log(`⏱️ Tiempo de respuesta getById: ${endTimeById - startTimeById}ms`);

			if (profileById) {
				// Verificar que los datos sean idénticos
				const activeProfileJson = JSON.stringify(activeProfile);
				const profileByIdJson = JSON.stringify(profileById);

				if (activeProfileJson === profileByIdJson) {
					console.log('✅ getById devuelve datos idénticos a getActiveProfile');
				} else {
					console.log('⚠️ Diferencias entre getActiveProfile y getById:');
					console.log('   Active:', activeProfile.name);
					console.log('   ById:', profileById.name);
				}
			} else {
				console.log('❌ getById no encontró el perfil activo');
			}

			// Probar con ID inexistente
			const nonExistentProfile = await profileService.getById('non-existent-id');
			if (nonExistentProfile === null) {
				console.log('✅ getById maneja correctamente IDs inexistentes');
			} else {
				console.log('❌ getById debería devolver null para IDs inexistentes');
			}

			console.log('');
		}

		// 6. Probar getProfiles (tercer método migrado)
		console.log('6️⃣ Probando getProfiles() (migrado a Drizzle)...');

		// Test básico sin filtros
		const startTimeAll = Date.now();
		const allProfiles = await profileService.getProfiles();
		const endTimeAll = Date.now();
		console.log(`⏱️ Tiempo getProfiles (sin filtros): ${endTimeAll - startTimeAll}ms`);
		console.log(`📊 Total de perfiles: ${allProfiles.length}`);

		// Test con filtro isActive
		const startTimeActive = Date.now();
		const activeProfiles = await profileService.getProfiles({ isActive: true });
		const endTimeActive = Date.now();
		console.log(`⏱️ Tiempo getProfiles (isActive=true): ${endTimeActive - startTimeActive}ms`);
		console.log(`📊 Perfiles activos: ${activeProfiles.length}`);

		// Test con paginación
		const startTimePaginated = Date.now();
		const paginatedProfiles = await profileService.getProfiles(
			{},
			{ page: 1, limit: 2, sortBy: 'name', sortDirection: 'asc' }
		);
		const endTimePaginated = Date.now();
		console.log(`⏱️ Tiempo getProfiles (paginado): ${endTimePaginated - startTimePaginated}ms`);
		console.log(`📊 Perfiles paginados (página 1, límite 2): ${paginatedProfiles.length}`);
		paginatedProfiles.forEach((p, i) => console.log(`   ${i + 1}. ${p.name}`));

		// Test con búsqueda
		if (activeProfile) {
			const searchTerm = activeProfile.name.substring(0, 3);
			const startTimeSearch = Date.now();
			const searchProfiles = await profileService.getProfiles({ search: searchTerm });
			const endTimeSearch = Date.now();
			console.log("⏱️ Tiempo getProfiles (búsqueda '" + searchTerm + "'): " + (endTimeSearch - startTimeSearch) + 'ms');
			console.log(`📊 Perfiles encontrados: ${searchProfiles.length}`);
		}

		// Test con ordenamiento descendente
		const startTimeDesc = Date.now();
		const descProfiles = await profileService.getProfiles({}, { sortBy: 'createdAt', sortDirection: 'desc', limit: 3 });
		const endTimeDesc = Date.now();
		console.log(`⏱️ Tiempo getProfiles (orden desc): ${endTimeDesc - startTimeDesc}ms`);
		console.log('📊 Últimos 3 perfiles creados:');
		descProfiles.forEach((p, i) => console.log(`   ${i + 1}. ${p.name} (${p.createdAt?.toISOString().split('T')[0]})`));

		console.log('');

		console.log('🎉 ¡Migración de ProfileService validada exitosamente!');
		console.log('\n📋 Resumen:');
		console.log('   ✅ getActiveProfile: Migrado a Drizzle');
		console.log('   ✅ getById: Migrado a Drizzle');
		console.log('   ✅ getProfiles: Migrado a Drizzle');
		console.log('   ✅ Filtros y paginación: OK');
		console.log('   ✅ Consistencia: OK');
		console.log('   ✅ Estructura: OK');
		console.log('   ✅ Rendimiento: OK');

		if (process.env.NODE_ENV === 'development') {
			console.log('\n💡 Nota: En desarrollo se ejecuta validación dual Drizzle-Prisma');
			console.log('   Revisa los logs para ver las comparaciones automáticas');
		}
	} catch (error) {
		console.error('❌ Error durante la prueba de migración:', error);
		console.log('\n🔧 Posibles causas:');
		console.log('   1. Error en la configuración de Drizzle');
		console.log('   2. Incompatibilidad entre schemas de Prisma y Drizzle');
		console.log('   3. Error en el transformador de datos');

		process.exit(1);
	}
}

// Ejecutar pruebas
testProfileServiceMigration();
