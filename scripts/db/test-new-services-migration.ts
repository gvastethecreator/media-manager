#!/usr/bin/env tsx

/**
 * Script de prueba para validar la migración de PropertyService y WildcardService
 *
 * Servicios a probar:
 * - PropertyService: getProperty(), getProperties()
 * - WildcardService: getWildcard(), getWildcards()
 */

import { serverLogger } from '@/lib/logger/server-logger';

// Property Service
import { getProperties, getProperty } from '@/services/property/property.service';

// Wildcard Service
import { getWildcard, getWildcards } from '@/services/wildcard/wildcard.service';

const logger = serverLogger.withContext('DrizzleTestNewServices');

async function testPropertyService() {
	logger.info('🏷️ === TESTING PROPERTY SERVICE ===');

	try {
		// Test getProperties
		logger.info('📋 Testing getProperties()...');
		const propertiesResult = await getProperties({
			orderBy: 'name',
			orderDirection: 'asc',
		});
		logger.info(
			`✅ getProperties: ${propertiesResult.properties.length} propiedades, total: ${propertiesResult.total}`
		);

		if (propertiesResult.properties.length > 0) {
			const firstProperty = propertiesResult.properties[0];
			logger.info(`📄 Primera propiedad: ${firstProperty.name} (${firstProperty.id})`);

			// Test getProperty con ID específico
			logger.info('🔍 Testing getProperty() con ID específico...');
			const property = await getProperty(firstProperty.id);
			if (property) {
				logger.info(`✅ getProperty: ${property.name} encontrada`);
			} else {
				logger.warn('⚠️ getProperty: No se encontró la propiedad');
			}
		}

		// Test búsqueda
		logger.info('🔍 Testing getProperties() con búsqueda...');
		const searchResult = await getProperties({
			search: 'test',
			orderBy: 'name',
		});
		logger.info(`✅ Búsqueda 'test': ${searchResult.properties.length} resultados`);

		// Test favoritos
		logger.info('⭐ Testing getProperties() solo favoritos...');
		const favoritesResult = await getProperties({
			onlyFavorites: true,
		});
		logger.info(`✅ Solo favoritos: ${favoritesResult.properties.length} propiedades`);
	} catch (error) {
		logger.error('❌ Error en PropertyService:', error);
	}
}

async function testWildcardService() {
	logger.info('🎭 === TESTING WILDCARD SERVICE ===');

	try {
		// Test getWildcards
		logger.info('📋 Testing getWildcards()...');
		const wildcardsResult = await getWildcards({
			orderBy: 'name',
			orderDirection: 'asc',
		});
		logger.info(`✅ getWildcards: ${wildcardsResult.wildcards.length} wildcards, total: ${wildcardsResult.total}`);

		if (wildcardsResult.wildcards.length > 0) {
			const firstWildcard = wildcardsResult.wildcards[0];
			logger.info(`🎭 Primer wildcard: ${firstWildcard.name} (${firstWildcard.id})`);

			// Test getWildcard con ID específico
			logger.info('🔍 Testing getWildcard() con ID específico...');
			const wildcard = await getWildcard(firstWildcard.id);
			if (wildcard) {
				logger.info(`✅ getWildcard: ${wildcard.name} encontrado`);
			} else {
				logger.warn('⚠️ getWildcard: No se encontró el wildcard');
			}
		}

		// Test búsqueda
		logger.info('🔍 Testing getWildcards() con búsqueda...');
		const searchResult = await getWildcards({
			search: 'test',
			orderBy: 'name',
		});
		logger.info(`✅ Búsqueda 'test': ${searchResult.wildcards.length} resultados`);

		// Test favoritos
		logger.info('⭐ Testing getWildcards() solo favoritos...');
		const favoritesResult = await getWildcards({
			onlyFavorites: true,
		});
		logger.info(`✅ Solo favoritos: ${favoritesResult.wildcards.length} wildcards`);

		// Test wildcards raíz
		logger.info('🌳 Testing getWildcards() raíz (parentId: null)...');
		const rootResult = await getWildcards({
			parentId: null,
		});
		logger.info(`✅ Wildcards raíz: ${rootResult.wildcards.length} wildcards`);
	} catch (error) {
		logger.error('❌ Error en WildcardService:', error);
	}
}

async function testInvalidIds() {
	logger.info('🚫 === TESTING INVALID IDS ===');

	try {
		// Test PropertyService con ID inválido
		const invalidProperty = await getProperty('invalid-id-123');
		logger.info(`✅ Property con ID inválido: ${invalidProperty ? 'Encontrada (¿?)' : 'null (correcto)'}`);

		// Test WildcardService con ID inválido
		const invalidWildcard = await getWildcard('invalid-id-456');
		logger.info(`✅ Wildcard con ID inválido: ${invalidWildcard ? 'Encontrado (¿?)' : 'null (correcto)'}`);
	} catch (error) {
		logger.error('❌ Error en pruebas de IDs inválidos:', error);
	}
}

async function main() {
	logger.info('🚀 Iniciando pruebas de migración de PropertyService y WildcardService...');

	const startTime = Date.now();

	await testPropertyService();
	await testWildcardService();
	await testInvalidIds();

	const endTime = Date.now();
	const duration = endTime - startTime;

	logger.info(`✅ Pruebas completadas en ${duration}ms`);
	logger.info('🎯 RESUMEN: PropertyService y WildcardService - métodos de lectura migrados a Drizzle');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
	main().catch((error) => {
		logger.error('💥 Error fatal en las pruebas:', error);
		process.exit(1);
	});
}

export { main as testNewServicesMigration };
