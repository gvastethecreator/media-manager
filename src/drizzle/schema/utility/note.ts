import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
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
import { prompts } from './prompt';
import { properties } from './property';
import { wildcards } from './wildcard';

// Definición de la tabla
export const notes = sqliteTable(
	'Note',
	{
		...organizationFields,
		title: text('title').notNull(),
		content: text('content').default(''),
		category: text('category').default('general'),
		priority: integer('priority').default(0),
		status: text('status').default('active'),
		presetId: text('presetId'),
	},
	(table) => {
		const indexes = createIndexes('note');
		return {
			nameIdx: indexes.nameIdx.on(table.name),
			categoryIdx: indexes.categoryIdx.on(table.category),
			createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
		};
	}
);

// Tablas de relación
export const notesToImages = createRelationTable('NoteToImage', 'Note', 'Image');
export const notesToVideos = createRelationTable('NoteToVideo', 'Note', 'Video');
export const notesToAlbums = createRelationTable('NoteToAlbum', 'Note', 'Album');
export const notesToCollections = createRelationTable('NoteToCollection', 'Note', 'Collection');
export const notesToTags = createRelationTable('NoteToTag', 'Note', 'Tag');
export const notesToCharacters = createRelationTable('NoteToCharacter', 'Note', 'Character');
export const notesToPlaces = createRelationTable('NoteToPlace', 'Note', 'Place');
export const notesToWorldItems = createRelationTable('NoteToWorldItem', 'Note', 'WorldItem');
export const notesToConcepts = createRelationTable('NoteToConcept', 'Note', 'Concept');
export const notesToPrompts = createRelationTable('NoteToPrompt', 'Note', 'Prompt');
export const notesToWildcards = createRelationTable('NoteToWildcard', 'Note', 'Wildcard');
export const notesToProperties = createRelationTable('NoteToProperty', 'Note', 'Property');
export const notesToGroups = createRelationTable('NoteToGroup', 'Note', 'Group');

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
	wildcards,
	properties,
	groups,
};

// Relaciones
export const notesRelations = relations(notes, createManyToManyRelations(relatedEntities));
