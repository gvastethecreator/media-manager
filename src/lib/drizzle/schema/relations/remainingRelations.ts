/**
 * =================================================================================
 * REMAINING RELATIONS - DRIZZLE ORM
 * =================================================================================
 * Definición de las relaciones many-to-many restantes del sistema
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Image-Wildcard
export const imageWildcards = sqliteTable(
	'_ImageToWildcard',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // wildcardId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToWildcard_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToWildcard_B_index').on(table.B),
	})
);

// Relación Video-Wildcard
export const videoWildcards = sqliteTable(
	'_VideoToWildcard',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // wildcardId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToWildcard_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToWildcard_B_index').on(table.B),
	})
);

// Relación Image-Character
export const imageCharacters = sqliteTable(
	'_ImageToCharacter',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // characterId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToCharacter_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToCharacter_B_index').on(table.B),
	})
);

// Relación Video-Character
export const videoCharacters = sqliteTable(
	'_VideoToCharacter',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // characterId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToCharacter_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToCharacter_B_index').on(table.B),
	})
);

// Relación Image-Place
export const imagePlaces = sqliteTable(
	'_ImageToPlace',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // placeId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToPlace_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToPlace_B_index').on(table.B),
	})
);

// Relación Video-Place
export const videoPlaces = sqliteTable(
	'_VideoToPlace',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // placeId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToPlace_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToPlace_B_index').on(table.B),
	})
);

// Relación Album-Place
export const albumPlaces = sqliteTable(
	'_AlbumToPlace',
	{
		A: text('A').notNull(), // albumId
		B: text('B').notNull(), // placeId
	},
	(table) => ({
		AB_unique: uniqueIndex('_AlbumToPlace_AB_unique').on(table.A, table.B),
		B_index: index('_AlbumToPlace_B_index').on(table.B),
	})
);

// Relación Character-Place
export const characterPlaces = sqliteTable(
	'_CharacterToPlace',
	{
		A: text('A').notNull(), // characterId
		B: text('B').notNull(), // placeId
	},
	(table) => ({
		AB_unique: uniqueIndex('_CharacterToPlace_AB_unique').on(table.A, table.B),
		B_index: index('_CharacterToPlace_B_index').on(table.B),
	})
);

// Relación Image-WorldItem
export const imageWorldItems = sqliteTable(
	'_ImageToWorldItem',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // worldItemId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToWorldItem_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToWorldItem_B_index').on(table.B),
	})
);

// Relación Video-WorldItem
export const videoWorldItems = sqliteTable(
	'_VideoToWorldItem',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // worldItemId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToWorldItem_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToWorldItem_B_index').on(table.B),
	})
);

// Relación Image-Concept
export const imageConcepts = sqliteTable(
	'_ImageToConcept',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // conceptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToConcept_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToConcept_B_index').on(table.B),
	})
);

// Relación Video-Concept
export const videoConcepts = sqliteTable(
	'_VideoToConcept',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // conceptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToConcept_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToConcept_B_index').on(table.B),
	})
);

// Relación Image-Prompt
export const imagePrompts = sqliteTable(
	'_ImageToPrompt',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // promptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToPrompt_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToPrompt_B_index').on(table.B),
	})
);

// Relación Video-Prompt
export const videoPrompts = sqliteTable(
	'_VideoToPrompt',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // promptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToPrompt_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToPrompt_B_index').on(table.B),
	})
);

// Relación Image-Note
export const imageNotes = sqliteTable(
	'_ImageToNote',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // noteId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToNote_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToNote_B_index').on(table.B),
	})
);

// Relación Video-Note
export const videoNotes = sqliteTable(
	'_VideoToNote',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // noteId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToNote_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToNote_B_index').on(table.B),
	})
);

// Relación Group-Image
export const groupImages = sqliteTable(
	'_GroupToImage',
	{
		A: text('A').notNull(), // groupId
		B: text('B').notNull(), // imageId
	},
	(table) => ({
		AB_unique: uniqueIndex('_GroupToImage_AB_unique').on(table.A, table.B),
		B_index: index('_GroupToImage_B_index').on(table.B),
	})
);

// Relación Group-Video
export const groupVideos = sqliteTable(
	'_GroupToVideo',
	{
		A: text('A').notNull(), // groupId
		B: text('B').notNull(), // videoId
	},
	(table) => ({
		AB_unique: uniqueIndex('_GroupToVideo_AB_unique').on(table.A, table.B),
		B_index: index('_GroupToVideo_B_index').on(table.B),
	})
);

// Relación Group-Album
export const groupAlbums = sqliteTable(
	'_GroupToAlbum',
	{
		A: text('A').notNull(), // groupId
		B: text('B').notNull(), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_GroupToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_GroupToAlbum_B_index').on(table.B),
	})
);

// Relación Group-Tag
export const groupTags = sqliteTable(
	'_GroupToTag',
	{
		A: text('A').notNull(), // groupId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_GroupToTag_AB_unique').on(table.A, table.B),
		B_index: index('_GroupToTag_B_index').on(table.B),
	})
);

// =================================================================================
// TASK RELATIONS
// =================================================================================

// Relación Image-Task
export const imageTasks = sqliteTable(
	'_ImageToTask',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // taskId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToTask_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToTask_B_index').on(table.B),
	})
);

// Relación Video-Task
export const videoTasks = sqliteTable(
	'_VideoToTask',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // taskId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToTask_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToTask_B_index').on(table.B),
	})
);

// Relación Album-Task
export const albumTasks = sqliteTable(
	'_AlbumToTask',
	{
		A: text('A').notNull(), // albumId
		B: text('B').notNull(), // taskId
	},
	(table) => ({
		AB_unique: uniqueIndex('_AlbumToTask_AB_unique').on(table.A, table.B),
		B_index: index('_AlbumToTask_B_index').on(table.B),
	})
);

// Relación Character-Task
export const characterTasks = sqliteTable(
	'_CharacterToTask',
	{
		A: text('A').notNull(), // characterId
		B: text('B').notNull(), // taskId
	},
	(table) => ({
		AB_unique: uniqueIndex('_CharacterToTask_AB_unique').on(table.A, table.B),
		B_index: index('_CharacterToTask_B_index').on(table.B),
	})
);
