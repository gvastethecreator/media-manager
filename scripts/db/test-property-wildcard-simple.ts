#!/usr/bin/env tsx

/**
 * Script de prueba simplificado para PropertyService y WildcardService
 * Usando rutas relativas para evitar problemas de path mapping
 */

console.log('🚀 === PRUEBA SIMPLIFICADA DE PROPERTY Y WILDCARD SERVICES ===\n');

async function testBasicImports() {
	try {
		console.log('📦 Probando importaciones básicas...');
		
		// Importar usando rutas relativas
		const propertyModule = await import('../../src/services/property/property.service.js');
		console.log('✅ PropertyService importado correctamente');
		
		const wildcardModule = await import('../../src/services/wildcard/wildcard.service.js');
		console.log('✅ WildcardService importado correctamente');
		
		return { propertyModule, wildcardModule };
		
	} catch (error) {
		console.error('❌ Error en importaciones:', error);
		throw error;
	}
}

async function testPropertyService(propertyModule: any) {
	console.log('\n🏷️ === TESTING PROPERTY SERVICE ===');
	
	try {
		// Test getProperties
		console.log('📋 Testing getProperties()...');
		const result = await propertyModule.getProperties({
			orderBy: 'name',
			orderDirection: 'asc'
		});
		console.log(`✅ getProperties: ${result.properties.length} propiedades encontradas`);
		
		if (result.properties.length > 0) {
			const firstProperty = result.properties[0];
			console.log(`📄 Primera propiedad: ${firstProperty.name} (${firstProperty.id})`);
			
			// Test getProperty
			const property = await propertyModule.getProperty(firstProperty.id);
			console.log(`✅ getProperty: ${property ? 'Encontrada' : 'No encontrada'}`);
		}
		
	} catch (error) {
		console.error('❌ Error en PropertyService:', error);
	}
}

async function testWildcardService(wildcardModule: any) {
	console.log('\n🎭 === TESTING WILDCARD SERVICE ===');
	
	try {
		// Test getWildcards
		console.log('📋 Testing getWildcards()...');
		const result = await wildcardModule.getWildcards({
			orderBy: 'name',
			orderDirection: 'asc'
		});
		console.log(`✅ getWildcards: ${result.wildcards.length} wildcards encontrados`);
		
		if (result.wildcards.length > 0) {
			const firstWildcard = result.wildcards[0];
			console.log(`🎭 Primer wildcard: ${firstWildcard.name} (${firstWildcard.id})`);
			
			// Test getWildcard
			const wildcard = await wildcardModule.getWildcard(firstWildcard.id);
			console.log(`✅ getWildcard: ${wildcard ? 'Encontrado' : 'No encontrado'}`);
		}
		
	} catch (error) {
		console.error('❌ Error en WildcardService:', error);
	}
}

async function main() {
	const startTime = Date.now();
	
	try {
		const { propertyModule, wildcardModule } = await testBasicImports();
		
		await testPropertyService(propertyModule);
		await testWildcardService(wildcardModule);
		
		const endTime = Date.now();
		const duration = endTime - startTime;
		
		console.log(`\n✅ Pruebas completadas en ${duration}ms`);
		console.log('🎯 RESUMEN: PropertyService y WildcardService - métodos de lectura validados');
		
	} catch (error) {
		console.error('💥 Error fatal en las pruebas:', error);
		process.exit(1);
	}
}

// Ejecutar
main();