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
import { concepts } from './concept';
import { notes } from './note';
import { properties } from './property';
import { wildcards } from './wildcard';

// Definición de la tabla
export const prompts = sqliteTable(
	'Prompt',
	{
		...organizationFields,
		content: text('content').default(''),
		purpose: text('purpose').default(''),
		parameters: text('parameters').default(''),
	},
	(table) => {
		const indexes = createIndexes('prompt');
		return {
			nameIdx: indexes.nameIdx.on(table.name),
			categoryIdx: indexes.categoryIdx.on(table.category),
			createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
		};
	}
);

// Tablas de relación
export const promptsToImages = createRelationTable('PromptToImage', 'Prompt', 'Image');
export const promptsToVideos = createRelationTable('PromptToVideo', 'Prompt', 'Video');
export const promptsToAlbums = createRelationTable('PromptToAlbum', 'Prompt', 'Album');
export const promptsToCollections = createRelationTable('PromptToCollection', 'Prompt', 'Collection');
export const promptsToTags = createRelationTable('PromptToTag', 'Prompt', 'Tag');
export const promptsToCharacters = createRelationTable('PromptToCharacter', 'Prompt', 'Character');
export const promptsToPlaces = createRelationTable('PromptToPlace', 'Prompt', 'Place');
export const promptsToWorldItems = createRelationTable('PromptToWorldItem', 'Prompt', 'WorldItem');
export const promptsToConcepts = createRelationTable('PromptToConcept', 'Prompt', 'Concept');
export const promptsToNotes = createRelationTable('PromptToNote', 'Prompt', 'Note');
export const promptsToWildcards = createRelationTable('PromptToWildcard', 'Prompt', 'Wildcard');
export const promptsToProperties = createRelationTable('PromptToProperty', 'Prompt', 'Property');
export const promptsToGroups = createRelationTable('PromptToGroup', 'Prompt', 'Group');

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
	notes,
	wildcards,
	properties,
	groups,
};

// Relaciones
export const promptsRelations = relations(prompts, createManyToManyRelations(relatedEntities));
