import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';
import { albums } from '../organization/album';
import { collections } from '../organization/collection';
import { groups } from '../organization/group';
import { tags } from '../organization/tag';
import { concepts } from '../utility/concept';
import { notes } from '../utility/note';
import { prompts } from '../utility/prompt';
import { properties } from '../utility/property';
import { wildcards } from '../utility/wildcard';
import { characters } from './character';
import { worldItems } from './worldItem';

export const places = sqliteTable(
	'Place',
	{
		...organizationFields,
		region: text('region').default('unknown'),
		type: text('type').default('unknown'),
		climate: text('climate').default('temperate'),
		population: integer('population').default(0),
		government: text('government').default('unknown'),
		dangers: text('dangers').default('empty_array'),
		resources: text('resources').default('empty_array'),
		lore: text('lore').default(''),
		history: text('history').default(''),
		stats: text('stats').default(''),
	},
	(table) => ({
		...createCommonIndexes(table),
	})
);

// Tablas de relación
export const placesToImages = createRelationTable('PlaceToImage', 'Place', 'Image');
export const placesToVideos = createRelationTable('PlaceToVideo', 'Place', 'Video');
export const placesToAlbums = createRelationTable('PlaceToAlbum', 'Place', 'Album');
export const placesToCollections = createRelationTable('PlaceToCollection', 'Place', 'Collection');
export const placesToTags = createRelationTable('PlaceToTag', 'Place', 'Tag');
export const placesToCharacters = createRelationTable('PlaceToCharacter', 'Place', 'Character');
export const placesToWorldItems = createRelationTable('PlaceToWorldItem', 'Place', 'WorldItem');
export const placesToConcepts = createRelationTable('PlaceToConcept', 'Place', 'Concept');
export const placesToPrompts = createRelationTable('PlaceToPrompt', 'Place', 'Prompt');
export const placesToNotes = createRelationTable('PlaceToNote', 'Place', 'Note');
export const placesToWildcards = createRelationTable('PlaceToWildcard', 'Place', 'Wildcard');
export const placesToProperties = createRelationTable('PlaceToProperty', 'Place', 'Property');
export const placesToGroups = createRelationTable('PlaceToGroup', 'Place', 'Group');

// Relaciones
export const placesRelations = relations(places, ({ many }) => ({
	images: many(images, { through: placesToImages }),
	videos: many(videos, { through: placesToVideos }),
	albums: many(albums, { through: placesToAlbums }),
	collections: many(collections, { through: placesToCollections }),
	tags: many(tags, { through: placesToTags }),
	characters: many(characters, { through: placesToCharacters }),
	worldItems: many(worldItems, { through: placesToWorldItems }),
	concepts: many(concepts, { through: placesToConcepts }),
	prompts: many(prompts, { through: placesToPrompts }),
	notes: many(notes, { through: placesToNotes }),
	wildcards: many(wildcards, { through: placesToWildcards }),
	properties: many(properties, { through: placesToProperties }),
	groups: many(groups, { through: placesToGroups }),
}));
