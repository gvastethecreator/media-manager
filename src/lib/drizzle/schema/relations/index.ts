/**
 * =================================================================================
 * RELATIONS DOMAIN SCHEMA - DRIZZLE ORM
 * =================================================================================
 * Definiciones de tablas para las relaciones many-to-many del sistema
 *
 * Tablas incluidas:
 * - imageAlbums: Relación Image-Album
 * - videoAlbums: Relación Video-Album
 * - imageCollections: Relación Image-Collection
 * - videoCollections: Relación Video-Collection
 * - imageTags: Relación Image-Tag
 * - videoTags: Relación Video-Tag
 * - imageProperties: Relación Image-Property
 * - videoProperties: Relación Video-Property
 * - imageWildcards: Relación Image-Wildcard
 * - videoWildcards: Relación Video-Wildcard
 * - imageCharacters: Relación Image-Character
 * - videoCharacters: Relación Video-Character
 * - imagePlaces: Relación Image-Place
 * - videoPlaces: Relación Video-Place
 * - imageWorldItems: Relación Image-WorldItem
 * - videoWorldItems: Relación Video-WorldItem
 * - imageConcepts: Relación Image-Concept
 * - videoConcepts: Relación Video-Concept
 * - imagePrompts: Relación Image-Prompt
 * - videoPrompts: Relación Video-Prompt
 * - imageNotes: Relación Image-Note
 * - videoNotes: Relación Video-Note
 * - groupImages: Relación Group-Image
 * - groupVideos: Relación Group-Video
 * - groupAlbums: Relación Group-Album
 * - groupTags: Relación Group-Tag
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// =================================================================================
// RELACIONES BÁSICAS DE ORGANIZACIÓN
// =================================================================================

// Relación Image-Album
export const imageAlbums = sqliteTable(
	'_ImageToAlbum',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToAlbum_B_index').on(table.B),
	})
);

// Relación Video-Album
export const videoAlbums = sqliteTable(
	'_VideoToAlbum',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToAlbum_B_index').on(table.B),
	})
);

// Relación Image-Collection
export const imageCollections = sqliteTable(
	'_ImageToCollection',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // collectionId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToCollection_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToCollection_B_index').on(table.B),
	})
);

// Relación Video-Collection
export const videoCollections = sqliteTable(
	'_VideoToCollection',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // collectionId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToCollection_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToCollection_B_index').on(table.B),
	})
);

// =================================================================================
// RELACIONES DE TAXONOMÍA
// =================================================================================

// Relación Image-Tag
export const imageTags = sqliteTable(
	'_ImageToTag',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToTag_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToTag_B_index').on(table.B),
	})
);

// Relación Video-Tag
export const videoTags = sqliteTable(
	'_VideoToTag',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToTag_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToTag_B_index').on(table.B),
	})
);

// Relación Image-Property
export const imageProperties = sqliteTable(
	'_ImageToProperty',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // propertyId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToProperty_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToProperty_B_index').on(table.B),
	})
);

// Relación Video-Property
export const videoProperties = sqliteTable(
	'_VideoToProperty',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // propertyId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToProperty_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToProperty_B_index').on(table.B),
	})
);

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

// =================================================================================
// RELACIONES DE ENTIDADES COMPLEJAS
// =================================================================================

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

// =================================================================================
// RELACIONES DE GRUPOS
// =================================================================================

// Relación Group-Image
export const groupImages = sqliteTable(
	'_GroupToImage',
	{
		groupId: text('groupId').notNull(),
		imageId: text('imageId').notNull(),
	},
	(table) => ({
		groupImageIdx: uniqueIndex('_GroupToImage_groupId_imageId_unique').on(table.groupId, table.imageId),
		groupIdIdx: index('_GroupToImage_groupId_idx').on(table.groupId),
		imageIdIdx: index('_GroupToImage_imageId_idx').on(table.imageId),
	})
);

// Relación Group-Video
export const groupVideos = sqliteTable(
	'_GroupToVideo',
	{
		groupId: text('groupId').notNull(),
		videoId: text('videoId').notNull(),
	},
	(table) => ({
		groupVideoIdx: uniqueIndex('_GroupToVideo_groupId_videoId_unique').on(table.groupId, table.videoId),
		groupIdIdx: index('_GroupToVideo_groupId_idx').on(table.groupId),
		videoIdIdx: index('_GroupToVideo_videoId_idx').on(table.videoId),
	})
);

// Relación Group-Album
export const groupAlbums = sqliteTable(
	'_GroupToAlbum',
	{
		groupId: text('groupId').notNull(),
		albumId: text('albumId').notNull(),
	},
	(table) => ({
		groupAlbumIdx: uniqueIndex('_GroupToAlbum_groupId_albumId_unique').on(table.groupId, table.albumId),
		groupIdIdx: index('_GroupToAlbum_groupId_idx').on(table.groupId),
		albumIdIdx: index('_GroupToAlbum_albumId_idx').on(table.albumId),
	})
);

// Relación Group-Tag
export const groupTags = sqliteTable(
	'_GroupToTag',
	{
		groupId: text('groupId').notNull(),
		tagId: text('tagId').notNull(),
	},
	(table) => ({
		groupTagIdx: uniqueIndex('_GroupToTag_groupId_tagId_unique').on(table.groupId, table.tagId),
		groupIdIdx: index('_GroupToTag_groupId_idx').on(table.groupId),
		tagIdIdx: index('_GroupToTag_tagId_idx').on(table.tagId),
	})
);
