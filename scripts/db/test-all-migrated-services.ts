/**
 * 🧪 Script de prueba masivo para todos los servicios migrados a Drizzle
 * @description Valida todos los servicios completamente migrados
 */

import { getActiveProfile, getProfiles } from '@/services/profile/profile.service';
import { getTag, getTags } from '@/services/tag/tag.service';
import { getAlbum, getAlbums } from '@/services/album/album.service';
import { ConceptService } from '@/services/concept/concept.service';
import { getPlaces } from '@/services/place/place.service';
import { getWorldItems } from '@/services/world-item/world-item.service';
import { getCollections } from '@/services/collection/collection.service';
import { getCharacters } from '@/services/character/character.service';
import { getDocuments } from '@/services/document/document.service';
import { getAudios } from '@/services/audio/audio.service';
import { getFile3Ds } from '@/services/file3d/file3d.service';
import { getJsonFiles } from '@/services/json-file/json-file.service';

async function main() {
	console.log('🚀 === PRUEBA MASIVA DE TODOS LOS SERVICIOS MIGRADOS ===\n');

	const services = [
		{ name: 'ProfileService', test: async () => { const profiles = await getProfiles(); return profiles.length; }},
		{ name: 'TagService', test: async () => { const tags = await getTags({}); return tags.length; }},
		{ name: 'AlbumService', test: async () => { const albums = await getAlbums({}); return albums.length; }},
		{ name: 'ConceptService', test: async () => { const concepts = await ConceptService.getConcepts({}); return concepts.length; }},
		{ name: 'PlaceService', test: async () => { const places = await getPlaces({}); return places.length; }},
		{ name: 'WorldItemService', test: async () => { const items = await getWorldItems({}); return items.length; }},
		{ name: 'CollectionService', test: async () => { const collections = await getCollections(); return collections.length; }},
		{ name: 'CharacterService', test: async () => { const result = await getCharacters({}); return result.characters.length; }},
		{ name: 'DocumentService', test: async () => { const documents = await getDocuments(); return documents.length; }},
		{ name: 'AudioService', test: async () => { const audios = await getAudios(); return audios.length; }},
		{ name: 'File3DService', test: async () => { const files = await getFile3Ds(); return files.length; }},
		{ name: 'JsonFileService', test: async () => { const files = await getJsonFiles(); return files.length; }}
	];

	let successCount = 0;
	let totalItems = 0;

	for (const service of services) {
		try {
			const count = await service.test();
			console.log(`✅ ${service.name}: ${count} items`);
			successCount++;
			totalItems += count;
		} catch (error) {
			console.log(`❌ ${service.name}: Error - ${error instanceof Error ? error.message : 'Error desconocido'}`);
		}
	}

	console.log('\n🎯 === RESUMEN FINAL ===');
	console.log(`✅ Servicios exitosos: ${successCount}/${services.length} (${Math.round((successCount / services.length) * 100)}%)`);
	console.log(`📦 Total items procesados: ${totalItems}`);

	if (successCount === services.length) {
		console.log('\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS! La migración a Drizzle está funcionando correctamente.');
	}
}

main().catch(console.error);