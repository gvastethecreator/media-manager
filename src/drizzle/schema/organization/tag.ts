import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { organizationFields } from '../base/common';
import { createIndexes, createManyToManyRelations, createRelationTable, relations } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';
import { concepts } from '../utility/concept';
import { notes } from '../utility/note';
import { prompts } from '../utility/prompt';
import { properties } from '../utility/property';
import { wildcards } from '../utility/wildcard';
import { characters } from '../world/character';
import { places } from '../world/place';
import { worldItems } from '../world/worldItem';
import { albums } from './album';
import { collections } from './collection';
import { groups } from './group';

// Definición de la tabla
export const tags = sqliteTable(
	'Tag',
	{
		...organizationFields,
	},
	(table) => {
		const indexes = createIndexes('tag');
		return {
			nameIdx: indexes.nameIdx.on(table.name),
			categoryIdx: indexes.categoryIdx.on(table.category),
			createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
		};
	}
);

// Tablas de relación
export const tagsToImages = createRelationTable('TagToImage', 'Tag', 'Image');
export const tagsToVideos = createRelationTable('TagToVideo', 'Tag', 'Video');
export const tagsToAlbums = createRelationTable('TagToAlbum', 'Tag', 'Album');
export const tagsToCollections = createRelationTable('TagToCollection', 'Tag', 'Collection');
export const tagsToGroups = createRelationTable('TagToGroup', 'Tag', 'Group');
export const tagsToCharacters = createRelationTable('TagToCharacter', 'Tag', 'Character');
export const tagsToPlaces = createRelationTable('TagToPlace', 'Tag', 'Place');
export const tagsToWorldItems = createRelationTable('TagToWorldItem', 'Tag', 'WorldItem');
export const tagsToConcepts = createRelationTable('TagToConcept', 'Tag', 'Concept');
export const tagsToNotes = createRelationTable('TagToNote', 'Tag', 'Note');
export const tagsToPrompts = createRelationTable('TagToPrompt', 'Tag', 'Prompt');
export const tagsToWildcards = createRelationTable('TagToWildcard', 'Tag', 'Wildcard');
export const tagsToProperties = createRelationTable('TagToProperty', 'Tag', 'Property');

// Definición de relaciones
const relatedEntities = {
	images,
	videos,
	albums,
	collections,
	groups,
	characters,
	places,
	worldItems,
	concepts,
	notes,
	prompts,
	wildcards,
	properties,
};

// Relaciones
export const tagsRelations = relations(tags, createManyToManyRelations(relatedEntities));
