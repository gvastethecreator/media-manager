import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
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
import { groups } from './group';
import { tags } from './tag';

// Definición de la tabla
export const collections = sqliteTable(
	'Collection',
	{
		...organizationFields,
		rating: real('rating').default(0),
		isFavorite: text('isFavorite').default('false'),
	},
	(table) => {
		const indexes = createIndexes('collection');
		return {
			nameIdx: indexes.nameIdx.on(table.name),
			categoryIdx: indexes.categoryIdx.on(table.category),
			createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
		};
	}
);

// Tablas de relación
export const collectionsToImages = createRelationTable('CollectionToImage', 'Collection', 'Image');
export const collectionsToVideos = createRelationTable('CollectionToVideo', 'Collection', 'Video');
export const collectionsToAlbums = createRelationTable('CollectionToAlbum', 'Collection', 'Album');
export const collectionsToTags = createRelationTable('CollectionToTag', 'Collection', 'Tag');
export const collectionsToGroups = createRelationTable('CollectionToGroup', 'Collection', 'Group');
export const collectionsToCharacters = createRelationTable('CollectionToCharacter', 'Collection', 'Character');
export const collectionsToPlaces = createRelationTable('CollectionToPlace', 'Collection', 'Place');
export const collectionsToWorldItems = createRelationTable('CollectionToWorldItem', 'Collection', 'WorldItem');
export const collectionsToConcepts = createRelationTable('CollectionToConcept', 'Collection', 'Concept');
export const collectionsToNotes = createRelationTable('CollectionToNote', 'Collection', 'Note');
export const collectionsToPrompts = createRelationTable('CollectionToPrompt', 'Collection', 'Prompt');
export const collectionsToWildcards = createRelationTable('CollectionToWildcard', 'Collection', 'Wildcard');
export const collectionsToProperties = createRelationTable('CollectionToProperty', 'Collection', 'Property');

// Definición de relaciones
const relatedEntities = {
	images,
	videos,
	albums,
	tags,
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
export const collectionsRelations = relations(collections, createManyToManyRelations(relatedEntities));
