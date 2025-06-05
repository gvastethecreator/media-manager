import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
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
import { notes } from './note';
import { prompts } from './prompt';
import { properties } from './property';
import { wildcards } from './wildcard';

// Definición de la tabla
export const concepts = sqliteTable(
	'Concept',
	{
		...organizationFields,
		content: text('content').default(''),
	},
	(table) => {
		const indexes = createIndexes('concept');
		return {
			nameIdx: indexes.nameIdx.on(table.name),
			categoryIdx: indexes.categoryIdx.on(table.category),
			createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
		};
	}
);

// Tablas de relación
export const conceptsToImages = createRelationTable('ConceptToImage', 'Concept', 'Image');
export const conceptsToVideos = createRelationTable('ConceptToVideo', 'Concept', 'Video');
export const conceptsToAlbums = createRelationTable('ConceptToAlbum', 'Concept', 'Album');
export const conceptsToCollections = createRelationTable('ConceptToCollection', 'Concept', 'Collection');
export const conceptsToTags = createRelationTable('ConceptToTag', 'Concept', 'Tag');
export const conceptsToCharacters = createRelationTable('ConceptToCharacter', 'Concept', 'Character');
export const conceptsToPlaces = createRelationTable('ConceptToPlace', 'Concept', 'Place');
export const conceptsToWorldItems = createRelationTable('ConceptToWorldItem', 'Concept', 'WorldItem');
export const conceptsToPrompts = createRelationTable('ConceptToPrompt', 'Concept', 'Prompt');
export const conceptsToNotes = createRelationTable('ConceptToNote', 'Concept', 'Note');
export const conceptsToWildcards = createRelationTable('ConceptToWildcard', 'Concept', 'Wildcard');
export const conceptsToProperties = createRelationTable('ConceptToProperty', 'Concept', 'Property');
export const conceptsToGroups = createRelationTable('ConceptToGroup', 'Concept', 'Group');

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
	prompts,
	notes,
	wildcards,
	properties,
	groups,
};

// Relaciones
export const conceptsRelations = relations(concepts, createManyToManyRelations(relatedEntities));
