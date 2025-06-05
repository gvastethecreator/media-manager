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
import { collections } from './collection';
import { groups } from './group';
import { tags } from './tag';

// Definición de la tabla
export const albums = sqliteTable(
	'Album',
	{
		...organizationFields,
	},
	(table) => {
		const indexes = createIndexes('album');
		return {
			nameIdx: indexes.nameIdx.on(table.name),
			categoryIdx: indexes.categoryIdx.on(table.category),
			createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
		};
	}
);

// Tablas de relación
export const albumsToImages = createRelationTable('AlbumToImage', 'Album', 'Image');
export const albumsToVideos = createRelationTable('AlbumToVideo', 'Album', 'Video');
export const albumsToCollections = createRelationTable('AlbumToCollection', 'Album', 'Collection');
export const albumsToTags = createRelationTable('AlbumToTag', 'Album', 'Tag');
export const albumsToGroups = createRelationTable('AlbumToGroup', 'Album', 'Group');
export const albumsToCharacters = createRelationTable('AlbumToCharacter', 'Album', 'Character');
export const albumsToPlaces = createRelationTable('AlbumToPlace', 'Album', 'Place');
export const albumsToWorldItems = createRelationTable('AlbumToWorldItem', 'Album', 'WorldItem');
export const albumsToConcepts = createRelationTable('AlbumToConcept', 'Album', 'Concept');
export const albumsToNotes = createRelationTable('AlbumToNote', 'Album', 'Note');
export const albumsToPrompts = createRelationTable('AlbumToPrompt', 'Album', 'Prompt');
export const albumsToWildcards = createRelationTable('AlbumToWildcard', 'Album', 'Wildcard');
export const albumsToProperties = createRelationTable('AlbumToProperty', 'Album', 'Property');

// Definición de relaciones
const relatedEntities = {
	images,
	videos,
	collections,
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
export const albumsRelations = relations(albums, createManyToManyRelations(relatedEntities));
