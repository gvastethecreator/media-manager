/**
 * 🧪 Script de prueba para PlaceService y WorldItemService migrados a Drizzle
 * @description Valida que las migraciones funcionen correctamente
 */

import { getPlaces, getPlaceById } from '@/services/place/place.service';
import { getWorldItems, getWorldItemById, getWorldItemWithStatsById } from '@/services/world-item/world-item.service';

async function testPlaceService() {
	console.log('\n🌍 === PRUEBAS DE PLACE SERVICE ===');

	try {
		// Prueba getPlaces
		console.log('\n📋 Probando getPlaces...');
		const places = await getPlaces({});
		console.log(`✅ getPlaces exitoso: ${places.length} places encontrados`);

		if (places.length > 0) {
			console.log(`   📍 Primer place: ${places[0].name} (${places[0].id})`);

			// Prueba getPlaceById
			console.log('\n🔍 Probando getPlaceById...');
			const place = await getPlaceById(places[0].id);
			if (place) {
				console.log(`✅ getPlaceById exitoso: ${place.name}`);
				console.log(`   📊 Stats: ${JSON.stringify(place._count)}`);
			} else {
				console.log('❌ getPlaceById falló: place no encontrado');
			}
		} else {
			console.log('ℹ️ No hay places para probar getPlaceById');
		}

	} catch (error) {
		console.error('❌ Error en PlaceService:', error);
	}
}

async function testWorldItemService() {
	console.log('\n🗡️ === PRUEBAS DE WORLD ITEM SERVICE ===');

	try {
		// Prueba getWorldItems
		console.log('\n📋 Probando getWorldItems...');
		const worldItems = await getWorldItems({});
		console.log(`✅ getWorldItems exitoso: ${worldItems.length} world items encontrados`);

		if (worldItems.length > 0) {
			console.log(`   🗡️ Primer world item: ${worldItems[0].name} (${worldItems[0].id})`);

			// Prueba getWorldItemById
			console.log('\n🔍 Probando getWorldItemById...');
			const worldItem = await getWorldItemById(worldItems[0].id);
			if (worldItem) {
				console.log(`✅ getWorldItemById exitoso: ${worldItem.name}`);
				console.log(`   📊 Tipo: ${worldItem.type}, Rareza: ${worldItem.rarity}`);
			} else {
				console.log('❌ getWorldItemById falló: world item no encontrado');
			}

			// Prueba getWorldItemWithStatsById
			console.log('\n📊 Probando getWorldItemWithStatsById...');
			const worldItemWithStats = await getWorldItemWithStatsById(worldItems[0].id);
			if (worldItemWithStats) {
				console.log(`✅ getWorldItemWithStatsById exitoso: ${worldItemWithStats.name}`);
				console.log(`   📊 Stats: ${JSON.stringify(worldItemWithStats._count)}`);
			} else {
				console.log('❌ getWorldItemWithStatsById falló: world item no encontrado');
			}
		} else {
			console.log('ℹ️ No hay world items para probar métodos individuales');
		}

	} catch (error) {
		console.error('❌ Error en WorldItemService:', error);
	}
}

async function main() {
	console.log('🚀 Iniciando pruebas de migración Place y WorldItem...');

	await testPlaceService();
	await testWorldItemService();

	console.log('\n✅ Pruebas completadas');
}

main().catch(console.error);