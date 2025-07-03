#!/usr/bin/env tsx

/**
 * Script de prueba para PropertyService y WildcardService con schema corregido
 * Verifica que los servicios funcionen correctamente después de sincronizar el schema con la BD real
 */

import { propertyService } from '@/services/property/property.service';
import { wildcardService } from '@/services/wildcard/wildcard.service';

async function testPropertyService() {
	console.log('\n🏷️ === PROBANDO PROPERTY SERVICE ===');

	try {
		// Obtener todas las propiedades
		console.log('\n📋 Obteniendo todas las propiedades...');
		const allProperties = await propertyService.getProperties();
		console.log(`✅ Total propiedades: ${allProperties.total}`);
		console.log(`📦 Propiedades obtenidas: ${allProperties.properties.length}`);

		if (allProperties.properties.length > 0) {
			const firstProperty = allProperties.properties[0];
			console.log(`🔍 Primera propiedad: ${firstProperty.name} (${firstProperty.id})`);
			console.log(`   - Emoji: ${firstProperty.emoji || 'N/A'}`);
			console.log(`   - Color: ${firstProperty.color || 'N/A'}`);
			console.log(`   - Favorito: ${firstProperty.isFavorite}`);
			console.log(`   - Shortcut: ${firstProperty.shortcut || 'N/A'}`);
			console.log(`   - FeaturedImage: ${firstProperty.featuredImage || 'N/A'}`);

			// Obtener propiedad específica por ID
			console.log(`\n🔍 Obteniendo propiedad por ID: ${firstProperty.id}`);
			const specificProperty = await propertyService.getProperty(firstProperty.id);
			if (specificProperty) {
				console.log(`✅ Propiedad encontrada: ${specificProperty.name}`);
			} else {
				console.log('❌ Propiedad no encontrada');
			}
		}

		// Buscar propiedades con filtros
		console.log('\n🔍 Probando búsqueda de propiedades...');
		const searchResults = await propertyService.getProperties({
			search: 'a',
			orderBy: 'name',
			orderDirection: 'asc'
		});
		console.log(`✅ Propiedades con 'a': ${searchResults.total}`);

		// Probar solo favoritos
		console.log('\n⭐ Probando filtro de favoritos...');
		const favoriteResults = await propertyService.getProperties({
			onlyFavorites: true
		});
		console.log(`✅ Propiedades favoritas: ${favoriteResults.total}`);

	} catch (error) {
		console.error('❌ Error en PropertyService:', error);
	}
}

async function testWildcardService() {
	console.log('\n🎭 === PROBANDO WILDCARD SERVICE ===');

	try {
		// Obtener todos los wildcards
		console.log('\n📋 Obteniendo todos los wildcards...');
		const allWildcards = await wildcardService.getWildcards();
		console.log(`✅ Total wildcards: ${allWildcards.total}`);
		console.log(`📦 Wildcards obtenidos: ${allWildcards.wildcards.length}`);

		if (allWildcards.wildcards.length > 0) {
			const firstWildcard = allWildcards.wildcards[0];
			console.log(`🔍 Primer wildcard: ${firstWildcard.name} (${firstWildcard.id})`);
			console.log(`   - Emoji: ${firstWildcard.emoji || 'N/A'}`);
			console.log(`   - Color: ${firstWildcard.color || 'N/A'}`);
			console.log(`   - Favorito: ${firstWildcard.isFavorite}`);
			console.log(`   - Shortcut: ${firstWildcard.shortcut || 'N/A'}`);
			console.log(`   - Children: ${firstWildcard.children || 'N/A'}`);
			console.log(`   - ParentId: ${firstWildcard.parentId || 'N/A'}`);

			// Obtener wildcard específico por ID
			console.log(`\n🔍 Obteniendo wildcard por ID: ${firstWildcard.id}`);
			const specificWildcard = await wildcardService.getWildcard(firstWildcard.id);
			if (specificWildcard) {
				console.log(`✅ Wildcard encontrado: ${specificWildcard.name}`);
			} else {
				console.log('❌ Wildcard no encontrado');
			}
		}

		// Buscar wildcards con filtros
		console.log('\n🔍 Probando búsqueda de wildcards...');
		const searchResults = await wildcardService.getWildcards({
			search: 'a',
			orderBy: 'name',
			orderDirection: 'asc'
		});
		console.log(`✅ Wildcards con 'a': ${searchResults.total}`);

		// Probar solo favoritos
		console.log('\n⭐ Probando filtro de favoritos...');
		const favoriteResults = await wildcardService.getWildcards({
			onlyFavorites: true
		});
		console.log(`✅ Wildcards favoritos: ${favoriteResults.total}`);

		// Probar filtro por parentId (raíz)
		console.log('\n🌳 Probando wildcards raíz...');
		const rootResults = await wildcardService.getWildcards({
			parentId: null
		});
		console.log(`✅ Wildcards raíz: ${rootResults.total}`);

	} catch (error) {
		console.error('❌ Error en WildcardService:', error);
	}
}

async function main() {
	console.log('🚀 === INICIANDO PRUEBAS DE SERVICIOS CORREGIDOS ===');
	console.log('📅 Fecha:', new Date().toISOString());

	await testPropertyService();
	await testWildcardService();

	console.log('\n✅ === PRUEBAS COMPLETADAS ===');
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
	main().catch(console.error);
}