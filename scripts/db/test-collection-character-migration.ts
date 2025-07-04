/**
 * 🧪 Script de prueba para CollectionService y CharacterService migrados a Drizzle
 * @description Valida que las migraciones funcionen correctamente
 */

import { getCharacter, getCharacters } from '@/services/character/character.service';
import { getCollection, getCollections, searchCollections } from '@/services/collection/collection.service';

async function testCollectionService() {
	console.log('\n📚 === PRUEBAS DE COLLECTION SERVICE ===');

	try {
		// Prueba getCollections
		console.log('\n📋 Probando getCollections...');
		const collections = await getCollections();
		console.log(`✅ getCollections exitoso: ${collections.length} colecciones encontradas`);

		if (collections.length > 0) {
			console.log(`   📚 Primera colección: ${collections[0].name} (${collections[0].id})`);

			// Prueba getCollection
			console.log('\n🔍 Probando getCollection...');
			const collection = await getCollection(collections[0].id);
			if (collection) {
				console.log(`✅ getCollection exitoso: ${collection.name}`);
				console.log(`   📊 Stats: ${JSON.stringify(collection._count)}`);
			} else {
				console.log('❌ getCollection falló: colección no encontrada');
			}
		} else {
			console.log('ℹ️ No hay colecciones para probar getCollection');
		}

		// Prueba searchCollections
		console.log('\n🔍 Probando searchCollections...');
		const searchResults = await searchCollections({});
		console.log(`✅ searchCollections exitoso: ${searchResults.length} colecciones encontradas`);
	} catch (error) {
		console.error('❌ Error en CollectionService:', error);
	}
}

async function testCharacterService() {
	console.log('\n👤 === PRUEBAS DE CHARACTER SERVICE ===');

	try {
		// Prueba getCharacters
		console.log('\n📋 Probando getCharacters...');
		const charactersResult = await getCharacters({});
		console.log(
			`✅ getCharacters exitoso: ${charactersResult.characters.length} personajes encontrados (total: ${charactersResult.total})`
		);

		if (charactersResult.characters.length > 0) {
			console.log(
				`   👤 Primer personaje: ${charactersResult.characters[0].name} (${charactersResult.characters[0].id})`
			);

			// Prueba getCharacter
			console.log('\n🔍 Probando getCharacter...');
			const character = await getCharacter(charactersResult.characters[0].id);
			if (character) {
				console.log(`✅ getCharacter exitoso: ${character.name}`);
				console.log(`   📊 Stats: ${JSON.stringify(character._count)}`);
				console.log(`   🎭 Clase: ${character.class}, Raza: ${character.race}`);
			} else {
				console.log('❌ getCharacter falló: personaje no encontrado');
			}
		} else {
			console.log('ℹ️ No hay personajes para probar getCharacter');
		}
	} catch (error) {
		console.error('❌ Error en CharacterService:', error);
	}
}

async function main() {
	console.log('🚀 Iniciando pruebas de migración Collection y Character...');

	await testCollectionService();
	await testCharacterService();

	console.log('\n✅ Pruebas completadas');
}

main().catch(console.error);
