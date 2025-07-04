/**
 * Script de reporte del estado de migración Drizzle
 * Genera un resumen completo de todos los servicios migrados
 */

import { getAlbum, getAlbums } from '@/services/album/album.service';
import { getCharacters } from '@/services/character/character.service';
import { getCollections } from '@/services/collection/collection.service';
import { ConceptService } from '@/services/concept/concept.service';
import { getImages } from '@/services/image/image.service';
// Nuevos servicios migrados
import { getPlaces } from '@/services/place/place.service';
import { getActiveProfile, getProfiles } from '@/services/profile/profile.service';
import { getTag, getTags } from '@/services/tag/tag.service';
import { getWorldItems } from '@/services/world-item/world-item.service';

interface ServiceStatus {
	name: string;
	status: 'COMPLETE' | 'PARTIAL' | 'PENDING';
	migratedMethods: string[];
	pendingMethods: string[];
	avgResponseTime?: number;
	errors: string[];
}

async function generateMigrationStatusReport() {
	console.log('📊 === REPORTE DE ESTADO DE MIGRACIÓN DRIZZLE ===\n');

	const services: ServiceStatus[] = [];

	// ProfileService - COMPLETO
	console.log('🔍 Probando ProfileService...');
	const profileStatus: ServiceStatus = {
		name: 'ProfileService',
		status: 'COMPLETE',
		migratedMethods: ['getActiveProfile', 'getProfiles'],
		pendingMethods: [],
		errors: [],
	};

	try {
		const times: number[] = [];

		const start1 = Date.now();
		await getActiveProfile();
		times.push(Date.now() - start1);

		const start2 = Date.now();
		await getProfiles({ page: 1, limit: 5 });
		times.push(Date.now() - start2);

		profileStatus.avgResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
		console.log(`   ✅ ProfileService: ${profileStatus.avgResponseTime}ms promedio`);
	} catch (error) {
		profileStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ ProfileService: Error');
	}

	services.push(profileStatus);

	// TagService - COMPLETO
	console.log('🔍 Probando TagService...');
	const tagStatus: ServiceStatus = {
		name: 'TagService',
		status: 'COMPLETE',
		migratedMethods: ['getTag', 'getTags'],
		pendingMethods: ['createTag', 'updateTag', 'deleteTag'],
		errors: [],
	};

	try {
		const times: number[] = [];

		const start1 = Date.now();
		await getTag('test-id');
		times.push(Date.now() - start1);

		const start2 = Date.now();
		await getTags({ search: 'test' });
		times.push(Date.now() - start2);

		tagStatus.avgResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
		console.log(`   ✅ TagService: ${tagStatus.avgResponseTime}ms promedio`);
	} catch (error) {
		tagStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ TagService: Error');
	}

	services.push(tagStatus);

	// AlbumService - COMPLETO
	console.log('🔍 Probando AlbumService...');
	const albumStatus: ServiceStatus = {
		name: 'AlbumService',
		status: 'COMPLETE',
		migratedMethods: ['getAlbum', 'getAlbums'],
		pendingMethods: ['createAlbum', 'updateAlbum', 'deleteAlbum'],
		errors: [],
	};

	try {
		const times: number[] = [];

		const start1 = Date.now();
		await getAlbum('test-id');
		times.push(Date.now() - start1);

		const start2 = Date.now();
		await getAlbums({ search: 'test' });
		times.push(Date.now() - start2);

		albumStatus.avgResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
		console.log(`   ✅ AlbumService: ${albumStatus.avgResponseTime}ms promedio`);
	} catch (error) {
		albumStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ AlbumService: Error');
	}

	services.push(albumStatus);

	// ConceptService - COMPLETO
	console.log('🔍 Probando ConceptService...');
	const conceptStatus: ServiceStatus = {
		name: 'ConceptService',
		status: 'COMPLETE',
		migratedMethods: ['getConcept', 'getConcepts'],
		pendingMethods: ['createConcept', 'updateConcept', 'deleteConcept'],
		errors: [],
	};

	try {
		const times: number[] = [];

		const start1 = Date.now();
		await ConceptService.getConcept('test-id');
		times.push(Date.now() - start1);

		const start2 = Date.now();
		await ConceptService.getConcepts({ search: 'test', pageSize: 5 });
		times.push(Date.now() - start2);

		conceptStatus.avgResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
		console.log(`   ✅ ConceptService: ${conceptStatus.avgResponseTime}ms promedio`);
	} catch (error) {
		conceptStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ ConceptService: Error');
	}

	services.push(conceptStatus);

	// PlaceService - COMPLETO
	console.log('🔍 Probando PlaceService...');
	const placeStatus: ServiceStatus = {
		name: 'PlaceService',
		status: 'COMPLETE',
		migratedMethods: ['getPlaces', 'getPlaceById'],
		pendingMethods: [],
		errors: [],
	};

	try {
		const places = await getPlaces({});
		placeStatus.avgResponseTime = Date.now() - start1;
		console.log(`   ✅ PlaceService: ${places.length} places encontrados`);
	} catch (error) {
		placeStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ PlaceService: Error');
	}

	services.push(placeStatus);

	// WorldItemService - COMPLETO
	console.log('�� Probando WorldItemService...');
	const worldItemStatus: ServiceStatus = {
		name: 'WorldItemService',
		status: 'COMPLETE',
		migratedMethods: ['getWorldItems', 'getWorldItemById', 'getWorldItemWithStatsById'],
		pendingMethods: [],
		errors: [],
	};

	try {
		const worldItems = await getWorldItems({});
		worldItemStatus.avgResponseTime = Date.now() - start1;
		console.log(`   ✅ WorldItemService: ${worldItems.length} world items encontrados`);
	} catch (error) {
		worldItemStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ WorldItemService: Error');
	}

	services.push(worldItemStatus);

	// CollectionService - COMPLETO
	console.log('🔍 Probando CollectionService...');
	const collectionStatus: ServiceStatus = {
		name: 'CollectionService',
		status: 'COMPLETE',
		migratedMethods: ['searchCollections', 'getCollections', 'getCollection'],
		pendingMethods: [],
		errors: [],
	};

	try {
		const collections = await getCollections();
		collectionStatus.avgResponseTime = Date.now() - start1;
		console.log(`   ✅ CollectionService: ${collections.length} colecciones encontradas`);
	} catch (error) {
		collectionStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ CollectionService: Error');
	}

	services.push(collectionStatus);

	// CharacterService - COMPLETO
	console.log('🔍 Probando CharacterService...');
	const characterStatus: ServiceStatus = {
		name: 'CharacterService',
		status: 'COMPLETE',
		migratedMethods: ['getCharacter', 'getCharacters'],
		pendingMethods: [],
		errors: [],
	};

	try {
		const charactersResult = await getCharacters({});
		characterStatus.avgResponseTime = Date.now() - start1;
		console.log(`   ✅ CharacterService: ${charactersResult.characters.length} personajes encontrados`);
	} catch (error) {
		characterStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ CharacterService: Error');
	}

	services.push(characterStatus);

	// ImageService - PARCIAL
	console.log('🔍 Probando ImageService...');
	const imageStatus: ServiceStatus = {
		name: 'ImageService',
		status: 'PARTIAL',
		migratedMethods: ['getImages'],
		pendingMethods: ['getImage', 'createImage', 'updateImage', 'deleteImage', 'relaciones many-to-many'],
		errors: [],
	};

	try {
		const start = Date.now();
		await getImages({ page: 1, limit: 5 });
		imageStatus.avgResponseTime = Date.now() - start;
		console.log(`   ✅ ImageService: ${imageStatus.avgResponseTime}ms`);
	} catch (error) {
		imageStatus.errors.push(error instanceof Error ? error.message : 'Error desconocido');
		console.log('   ❌ ImageService: Error');
	}

	services.push(imageStatus);

	// Generar reporte final
	console.log('\n📋 === RESUMEN EJECUTIVO ===');

	const completeServices = services.filter((s) => s.status === 'COMPLETE').length;
	const partialServices = services.filter((s) => s.status === 'PARTIAL').length;
	const totalMethods = services.reduce((acc, s) => acc + s.migratedMethods.length, 0);
	const avgTime =
		services.filter((s) => s.avgResponseTime).reduce((acc, s) => acc + (s.avgResponseTime || 0), 0) /
		services.filter((s) => s.avgResponseTime).length;

	console.log(`📊 Servicios completamente migrados: ${completeServices}`);
	console.log(`🔄 Servicios parcialmente migrados: ${partialServices}`);
	console.log(`📈 Total métodos migrados: ${totalMethods}`);
	console.log(`⚡ Tiempo promedio de respuesta: ${Math.round(avgTime)}ms`);
	console.log(`❌ Servicios con errores: ${services.filter((s) => s.errors.length > 0).length}`);

	console.log('\n🔍 === DETALLE POR SERVICIO ===');

	services.forEach((service) => {
		const statusIcon = service.status === 'COMPLETE' ? '✅' : service.status === 'PARTIAL' ? '🔄' : '❌';
		console.log(`\n${statusIcon} **${service.name}** (${service.status})`);
		console.log(`   📝 Métodos migrados: ${service.migratedMethods.join(', ')}`);
		if (service.pendingMethods.length > 0) {
			console.log(`   ⏳ Pendientes: ${service.pendingMethods.join(', ')}`);
		}
		if (service.avgResponseTime) {
			console.log(`   ⚡ Tiempo promedio: ${service.avgResponseTime}ms`);
		}
		if (service.errors.length > 0) {
			console.log(`   ❌ Errores: ${service.errors.join(', ')}`);
		}
	});

	console.log('\n🎯 === PRÓXIMOS PASOS RECOMENDADOS ===');
	console.log('1. Migrar CollectionService y CharacterService (estructura compleja)');
	console.log('2. Completar relaciones many-to-many en ImageService');
	console.log('3. Migrar endpoints restantes de FolderService');
	console.log('4. Implementar métodos de escritura (CREATE, UPDATE, DELETE)');
	console.log('5. Optimizar conteos con subqueries en lugar de valores estáticos');

	console.log('\n✅ Reporte completado');
}

async function testNewServices() {
	console.log('\n🆕 === PRUEBAS DE SERVICIOS RECIÉN MIGRADOS ===');

	try {
		// PlaceService
		console.log('\n🌍 Probando PlaceService...');
		const places = await getPlaces({});
		console.log(`✅ PlaceService: ${places.length} places encontrados`);

		// WorldItemService
		console.log('\n🗡️ Probando WorldItemService...');
		const worldItems = await getWorldItems({});
		console.log(`✅ WorldItemService: ${worldItems.length} world items encontrados`);

		// CollectionService
		console.log('\n📚 Probando CollectionService...');
		const collections = await getCollections();
		console.log(`✅ CollectionService: ${collections.length} colecciones encontradas`);

		// CharacterService
		console.log('\n👤 Probando CharacterService...');
		const charactersResult = await getCharacters({});
		console.log(`✅ CharacterService: ${charactersResult.characters.length} personajes encontrados`);
	} catch (error) {
		console.error('❌ Error en pruebas de servicios nuevos:', error);
	}
}

// Ejecutar automáticamente
generateMigrationStatusReport()
	.then(() => {
		console.log('\n🏁 Script completado exitosamente');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Error en el script:', error);
		process.exit(1);
	});
