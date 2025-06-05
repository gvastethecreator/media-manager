import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { organizationFields } from '../base/common';
import { createIndexes, createManyToManyRelations, createRelationTable, relations } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';
import { albums } from '../organization/album';
import { collections } from '../organization/collection';
import { groups } from '../organization/group';
import { tags } from '../organization/tag';
import { characters } from '../world/character';
import { places } from '../world/place';
import { worldItems } from '../world/worldItem';
import { concepts } from './concept';
import { notes } from './note';
import { prompts } from './prompt';
import { wildcards } from './wildcard';

// Definición de la tabla
export const properties = sqliteTable(
	'Property',
	{
		...organizationFields,
	},
	(table) => {
		const indexes = createIndexes('property');
		return {
			nameIdx: indexes.nameIdx.on(table.name),
			categoryIdx: indexes.categoryIdx.on(table.category),
			createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
		};
	}
);

// Tablas de relación
export const propertiesToImages = createRelationTable('PropertyToImage', 'Property', 'Image');
export const propertiesToVideos = createRelationTable('PropertyToVideo', 'Property', 'Video');
export const propertiesToAlbums = createRelationTable('PropertyToAlbum', 'Property', 'Album');
export const propertiesToCollections = createRelationTable('PropertyToCollection', 'Property', 'Collection');
export const propertiesToTags = createRelationTable('PropertyToTag', 'Property', 'Tag');
export const propertiesToCharacters = createRelationTable('PropertyToCharacter', 'Property', 'Character');
export const propertiesToPlaces = createRelationTable('PropertyToPlace', 'Property', 'Place');
export const propertiesToWorldItems = createRelationTable('PropertyToWorldItem', 'Property', 'WorldItem');
export const propertiesToConcepts = createRelationTable('PropertyToConcept', 'Property', 'Concept');
export const propertiesToPrompts = createRelationTable('PropertyToPrompt', 'Property', 'Prompt');
export const propertiesToNotes = createRelationTable('PropertyToNote', 'Property', 'Note');
export const propertiesToWildcards = createRelationTable('PropertyToWildcard', 'Property', 'Wildcard');
export const propertiesToGroups = createRelationTable('PropertyToGroup', 'Property', 'Group');

// Definición de relaciones
const relatedEntities = {
	images,
	videos,
	albums,
	collections,
	tags,
	characters,
	places,
	worldItems,
	concepts,
	prompts,
	notes,
	wildcards,
	groups,
};

// Relaciones
export const propertiesRelations = relations(properties, createManyToManyRelations(relatedEntities));
