/**
 * =================================================================================
 * RELACIONES DRIZZLE ORM - ESQUEMA COMPLETO
 * =================================================================================
 * Este archivo define todas las relaciones entre las tablas usando la sintaxis de Drizzle.
 * Reemplaza las relaciones implícitas de Prisma con relaciones explícitas de Drizzle.
 *
 * ✅ UNIFICADO A SQLITE - Enero 2025
 * 🔧 RELACIONES COMPLETAS - Enero 2025
 * =================================================================================
 */

import { relations } from 'drizzle-orm';
import * as schema from './schema/index.js';

// =================================================================================
// RELACIONES DE ENTIDADES PRINCIPALES
// =================================================================================

/**
 * 👤 Relaciones de Profile
 */
export const profileRelations = relations(schema.profiles, ({ one, many }) => ({
	// Relación 1:1 con Settings
	settings: one(schema.settings, {
		fields: [schema.profiles.settingsId],
		references: [schema.settings.id],
	}),
	// Relación 1:1 con Image (avatar)
	avatar: one(schema.images, {
		fields: [schema.profiles.imageId],
		references: [schema.images.id],
	}),
}));

/**
 * ⚙️ Relaciones de Settings
 */
export const settingsRelations = relations(schema.settings, ({ one }) => ({
	// Relación 1:1 con Profile
	profile: one(schema.profiles, {
		fields: [schema.settings.profileId],
		references: [schema.profiles.id],
	}),
}));

/**
 * 📁 Relaciones de Folder
 */
export const folderRelations = relations(schema.folders, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.folders, {
		fields: [schema.folders.parentId],
		references: [schema.folders.id],
	}),
	children: many(schema.folders),

	// Archivos contenidos
	images: many(schema.images),
	videos: many(schema.videos),
	audios: many(schema.audios),
	documents: many(schema.documents),
	jsonFiles: many(schema.jsonFiles),
	file3Ds: many(schema.file3Ds),
	files: many(schema.files),
}));

/**
 * 🖼️ Relaciones de Image
 */
export const imageRelations = relations(schema.images, ({ one, many }) => ({
	// Relación con Folder
	folder: one(schema.folders, {
		fields: [schema.images.folderId],
		references: [schema.folders.id],
	}),

	// Relación con Note
	note: one(schema.notes, {
		fields: [schema.images.noteId],
		references: [schema.notes.id],
	}),

	// Estadísticas
	stats: one(schema.imageStats, {
		fields: [schema.images.id],
		references: [schema.imageStats.imageId],
	}),

	// Relaciones many-to-many
	albums: many(schema.imageAlbums),
	collections: many(schema.imageCollections),
	tags: many(schema.imageTags),
	properties: many(schema.imageProperties),
	wildcards: many(schema.imageWildcards),
	characters: many(schema.imageCharacters),
	places: many(schema.imagePlaces),
	worldItems: many(schema.imageWorldItems),
	concepts: many(schema.imageConcepts),
	prompts: many(schema.imagePrompts),
	notes: many(schema.imageNotes),
	groups: many(schema.groupImages),

	// Actividades relacionadas
	activities: many(schema.activities),

	// Imágenes subidas
	uploadedImages: many(schema.uploadedImages),
}));

/**
 * 🎬 Relaciones de Video
 */
export const videoRelations = relations(schema.videos, ({ one, many }) => ({
	// Relación con Folder
	folder: one(schema.folders, {
		fields: [schema.videos.folderId],
		references: [schema.folders.id],
	}),

	// Relaciones many-to-many
	albums: many(schema.videoAlbums),
	collections: many(schema.videoCollections),
	tags: many(schema.videoTags),
	properties: many(schema.videoProperties),
	wildcards: many(schema.videoWildcards),
	characters: many(schema.videoCharacters),
	places: many(schema.videoPlaces),
	worldItems: many(schema.videoWorldItems),
	concepts: many(schema.videoConcepts),
	prompts: many(schema.videoPrompts),
	notes: many(schema.videoNotes),
	groups: many(schema.groupVideos),
}));

/**
 * 🎵 Relaciones de Audio
 */
export const audioRelations = relations(schema.audios, ({ one }) => ({
	// Relación con Folder
	folder: one(schema.folders, {
		fields: [schema.audios.folderId],
		references: [schema.folders.id],
	}),
}));

/**
 * 📄 Relaciones de Document
 */
export const documentRelations = relations(schema.documents, ({ one }) => ({
	// Relación con Folder
	folder: one(schema.folders, {
		fields: [schema.documents.folderId],
		references: [schema.folders.id],
	}),
}));

/**
 * 📋 Relaciones de JsonFile
 */
export const jsonFileRelations = relations(schema.jsonFiles, ({ one }) => ({
	// Relación con Folder
	folder: one(schema.folders, {
		fields: [schema.jsonFiles.folderId],
		references: [schema.folders.id],
	}),
}));

/**
 * 🎯 Relaciones de File3D
 */
export const file3DRelations = relations(schema.file3Ds, ({ one }) => ({
	// Relación con Folder
	folder: one(schema.folders, {
		fields: [schema.file3Ds.folderId],
		references: [schema.folders.id],
	}),
}));

/**
 * 📁 Relaciones de File (genérico)
 */
export const fileRelations = relations(schema.files, ({ one }) => ({
	// Relación con Folder
	folder: one(schema.folders, {
		fields: [schema.files.folderId],
		references: [schema.folders.id],
	}),
}));

/**
 * 📔 Relaciones de Album
 */
export const albumRelations = relations(schema.albums, ({ many }) => ({
	// Relaciones many-to-many
	images: many(schema.imageAlbums),
	videos: many(schema.videoAlbums),
	groups: many(schema.groupAlbums),
}));

/**
 * 📚 Relaciones de Collection
 */
export const collectionRelations = relations(schema.collections, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.collections, {
		fields: [schema.collections.parentId],
		references: [schema.collections.id],
	}),
	children: many(schema.collections),

	// Relaciones many-to-many
	images: many(schema.imageCollections),
	videos: many(schema.videoCollections),
}));

/**
 * 🏷️ Relaciones de Tag
 */
export const tagRelations = relations(schema.tags, ({ many }) => ({
	// Relaciones many-to-many
	images: many(schema.imageTags),
	videos: many(schema.videoTags),
	groups: many(schema.groupTags),
}));

/**
 * 🔍 Relaciones de Property
 */
export const propertyRelations = relations(schema.properties, ({ many }) => ({
	// Relaciones many-to-many
	images: many(schema.imageProperties),
	videos: many(schema.videoProperties),
}));

/**
 * 🎭 Relaciones de Wildcard
 */
export const wildcardRelations = relations(schema.wildcards, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.wildcards, {
		fields: [schema.wildcards.parentId],
		references: [schema.wildcards.id],
	}),
	children: many(schema.wildcards),

	// Relaciones many-to-many
	images: many(schema.imageWildcards),
	videos: many(schema.videoWildcards),
}));

/**
 * 👤 Relaciones de Character
 */
export const characterRelations = relations(schema.characters, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.characters, {
		fields: [schema.characters.parentId],
		references: [schema.characters.id],
	}),
	children: many(schema.characters),

	// Relaciones many-to-many
	images: many(schema.imageCharacters),
	videos: many(schema.videoCharacters),
}));

/**
 * 📍 Relaciones de Place
 */
export const placeRelations = relations(schema.places, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.places, {
		fields: [schema.places.parentId],
		references: [schema.places.id],
	}),
	children: many(schema.places),

	// Relaciones many-to-many
	images: many(schema.imagePlaces),
	videos: many(schema.videoPlaces),
}));

/**
 * 🎯 Relaciones de WorldItem
 */
export const worldItemRelations = relations(schema.worldItems, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.worldItems, {
		fields: [schema.worldItems.parentId],
		references: [schema.worldItems.id],
	}),
	children: many(schema.worldItems),

	// Relaciones many-to-many
	images: many(schema.imageWorldItems),
	videos: many(schema.videoWorldItems),
}));

/**
 * 💡 Relaciones de Concept
 */
export const conceptRelations = relations(schema.concepts, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.concepts, {
		fields: [schema.concepts.parentId],
		references: [schema.concepts.id],
	}),
	children: many(schema.concepts),

	// Relaciones many-to-many
	images: many(schema.imageConcepts),
	videos: many(schema.videoConcepts),
}));

/**
 * 🔮 Relaciones de Prompt
 */
export const promptRelations = relations(schema.prompts, ({ one, many }) => ({
	// Relación jerárquica (self-reference)
	parent: one(schema.prompts, {
		fields: [schema.prompts.parentId],
		references: [schema.prompts.id],
	}),
	children: many(schema.prompts),

	// Relaciones many-to-many
	images: many(schema.imagePrompts),
	videos: many(schema.videoPrompts),
}));

/**
 * 📝 Relaciones de Note
 */
export const noteRelations = relations(schema.notes, ({ many }) => ({
	// Relaciones many-to-many
	images: many(schema.imageNotes),
	videos: many(schema.videoNotes),
}));

/**
 * 👥 Relaciones de Group
 */
export const groupRelations = relations(schema.groups, ({ many }) => ({
	// Relaciones many-to-many
	images: many(schema.groupImages),
	videos: many(schema.groupVideos),
	albums: many(schema.groupAlbums),
	tags: many(schema.groupTags),
}));

// =================================================================================
// RELACIONES DE TABLAS AUXILIARES
// =================================================================================

/**
 * 📊 Relaciones de ImageStats
 */
export const imageStatsRelations = relations(schema.imageStats, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageStats.imageId],
		references: [schema.images.id],
	}),
}));

/**
 * 📋 Relaciones de Activity
 */
export const activityRelations = relations(schema.activities, ({ one }) => ({
	// Las actividades usan relaciones polimórficas basadas en entityType y entityId
	// La relación con imágenes se resuelve en el código de aplicación
}));

/**
 * 🔼 Relaciones de UploadedImage
 */
export const uploadedImageRelations = relations(schema.uploadedImages, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.uploadedImages.imageId],
		references: [schema.images.id],
	}),
}));

/**
 * 🏷️ Relaciones de Metadata
 */
export const metadataRelations = relations(schema.metadatas, ({ one }) => ({
	// Relación polimórfica - se resuelve en el código de aplicación
	// basándose en entityType y entityId
}));

/**
 * 🖼️ Relaciones de Thumbnail
 */
export const thumbnailRelations = relations(schema.thumbnails, ({ one }) => ({
	// Relación polimórfica - se resuelve en el código de aplicación
	// basándose en entityType y entityId
}));

/**
 * ⭐ Relaciones de Favorite
 */
export const favoriteRelations = relations(schema.favorites, ({ one }) => ({
	// Relación polimórfica - se resuelve en el código de aplicación
	// basándose en entityType y entityId
}));

// =================================================================================
// RELACIONES DE TABLAS MANY-TO-MANY
// =================================================================================

/**
 * 📔🖼️ Relaciones Image-Album
 */
export const imageAlbumRelations = relations(schema.imageAlbums, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageAlbums.A],
		references: [schema.images.id],
	}),
	album: one(schema.albums, {
		fields: [schema.imageAlbums.B],
		references: [schema.albums.id],
	}),
}));

/**
 * 📔🎬 Relaciones Video-Album
 */
export const videoAlbumRelations = relations(schema.videoAlbums, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoAlbums.A],
		references: [schema.videos.id],
	}),
	album: one(schema.albums, {
		fields: [schema.videoAlbums.B],
		references: [schema.albums.id],
	}),
}));

/**
 * 📚🖼️ Relaciones Image-Collection
 */
export const imageCollectionRelations = relations(schema.imageCollections, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageCollections.A],
		references: [schema.images.id],
	}),
	collection: one(schema.collections, {
		fields: [schema.imageCollections.B],
		references: [schema.collections.id],
	}),
}));

/**
 * 📚🎬 Relaciones Video-Collection
 */
export const videoCollectionRelations = relations(schema.videoCollections, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoCollections.A],
		references: [schema.videos.id],
	}),
	collection: one(schema.collections, {
		fields: [schema.videoCollections.B],
		references: [schema.collections.id],
	}),
}));

/**
 * 🏷️🖼️ Relaciones Image-Tag
 */
export const imageTagRelations = relations(schema.imageTags, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageTags.A],
		references: [schema.images.id],
	}),
	tag: one(schema.tags, {
		fields: [schema.imageTags.B],
		references: [schema.tags.id],
	}),
}));

/**
 * 🏷️🎬 Relaciones Video-Tag
 */
export const videoTagRelations = relations(schema.videoTags, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoTags.A],
		references: [schema.videos.id],
	}),
	tag: one(schema.tags, {
		fields: [schema.videoTags.B],
		references: [schema.tags.id],
	}),
}));

/**
 * 🔍🖼️ Relaciones Image-Property
 */
export const imagePropertyRelations = relations(schema.imageProperties, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageProperties.A],
		references: [schema.images.id],
	}),
	property: one(schema.properties, {
		fields: [schema.imageProperties.B],
		references: [schema.properties.id],
	}),
}));

/**
 * 🔍🎬 Relaciones Video-Property
 */
export const videoPropertyRelations = relations(schema.videoProperties, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoProperties.A],
		references: [schema.videos.id],
	}),
	property: one(schema.properties, {
		fields: [schema.videoProperties.B],
		references: [schema.properties.id],
	}),
}));

/**
 * 🎭🖼️ Relaciones Image-Wildcard
 */
export const imageWildcardRelations = relations(schema.imageWildcards, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageWildcards.A],
		references: [schema.images.id],
	}),
	wildcard: one(schema.wildcards, {
		fields: [schema.imageWildcards.B],
		references: [schema.wildcards.id],
	}),
}));

/**
 * 🎭🎬 Relaciones Video-Wildcard
 */
export const videoWildcardRelations = relations(schema.videoWildcards, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoWildcards.A],
		references: [schema.videos.id],
	}),
	wildcard: one(schema.wildcards, {
		fields: [schema.videoWildcards.B],
		references: [schema.wildcards.id],
	}),
}));

/**
 * 👤🖼️ Relaciones Image-Character
 */
export const imageCharacterRelations = relations(schema.imageCharacters, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageCharacters.A],
		references: [schema.images.id],
	}),
	character: one(schema.characters, {
		fields: [schema.imageCharacters.B],
		references: [schema.characters.id],
	}),
}));

/**
 * 👤🎬 Relaciones Video-Character
 */
export const videoCharacterRelations = relations(schema.videoCharacters, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoCharacters.A],
		references: [schema.videos.id],
	}),
	character: one(schema.characters, {
		fields: [schema.videoCharacters.B],
		references: [schema.characters.id],
	}),
}));

/**
 * 📍🖼️ Relaciones Image-Place
 */
export const imagePlaceRelations = relations(schema.imagePlaces, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imagePlaces.A],
		references: [schema.images.id],
	}),
	place: one(schema.places, {
		fields: [schema.imagePlaces.B],
		references: [schema.places.id],
	}),
}));

/**
 * 📍🎬 Relaciones Video-Place
 */
export const videoPlaceRelations = relations(schema.videoPlaces, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoPlaces.A],
		references: [schema.videos.id],
	}),
	place: one(schema.places, {
		fields: [schema.videoPlaces.B],
		references: [schema.places.id],
	}),
}));

/**
 * 🎯🖼️ Relaciones Image-WorldItem
 */
export const imageWorldItemRelations = relations(schema.imageWorldItems, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageWorldItems.A],
		references: [schema.images.id],
	}),
	worldItem: one(schema.worldItems, {
		fields: [schema.imageWorldItems.B],
		references: [schema.worldItems.id],
	}),
}));

/**
 * 🎯🎬 Relaciones Video-WorldItem
 */
export const videoWorldItemRelations = relations(schema.videoWorldItems, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoWorldItems.A],
		references: [schema.videos.id],
	}),
	worldItem: one(schema.worldItems, {
		fields: [schema.videoWorldItems.B],
		references: [schema.worldItems.id],
	}),
}));

/**
 * 💡🖼️ Relaciones Image-Concept
 */
export const imageConceptRelations = relations(schema.imageConcepts, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageConcepts.A],
		references: [schema.images.id],
	}),
	concept: one(schema.concepts, {
		fields: [schema.imageConcepts.B],
		references: [schema.concepts.id],
	}),
}));

/**
 * 💡🎬 Relaciones Video-Concept
 */
export const videoConceptRelations = relations(schema.videoConcepts, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoConcepts.A],
		references: [schema.videos.id],
	}),
	concept: one(schema.concepts, {
		fields: [schema.videoConcepts.B],
		references: [schema.concepts.id],
	}),
}));

/**
 * 🔮🖼️ Relaciones Image-Prompt
 */
export const imagePromptRelations = relations(schema.imagePrompts, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imagePrompts.A],
		references: [schema.images.id],
	}),
	prompt: one(schema.prompts, {
		fields: [schema.imagePrompts.B],
		references: [schema.prompts.id],
	}),
}));

/**
 * 🔮🎬 Relaciones Video-Prompt
 */
export const videoPromptRelations = relations(schema.videoPrompts, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoPrompts.A],
		references: [schema.videos.id],
	}),
	prompt: one(schema.prompts, {
		fields: [schema.videoPrompts.B],
		references: [schema.prompts.id],
	}),
}));

/**
 * 📝🖼️ Relaciones Image-Note
 */
export const imageNoteRelations = relations(schema.imageNotes, ({ one }) => ({
	image: one(schema.images, {
		fields: [schema.imageNotes.A],
		references: [schema.images.id],
	}),
	note: one(schema.notes, {
		fields: [schema.imageNotes.B],
		references: [schema.notes.id],
	}),
}));

/**
 * 📝🎬 Relaciones Video-Note
 */
export const videoNoteRelations = relations(schema.videoNotes, ({ one }) => ({
	video: one(schema.videos, {
		fields: [schema.videoNotes.A],
		references: [schema.videos.id],
	}),
	note: one(schema.notes, {
		fields: [schema.videoNotes.B],
		references: [schema.notes.id],
	}),
}));

/**
 * 👥🖼️ Relaciones Group-Image
 */
export const groupImageRelations = relations(schema.groupImages, ({ one }) => ({
	group: one(schema.groups, {
		fields: [schema.groupImages.groupId],
		references: [schema.groups.id],
	}),
	image: one(schema.images, {
		fields: [schema.groupImages.imageId],
		references: [schema.images.id],
	}),
}));

/**
 * 👥🎬 Relaciones Group-Video
 */
export const groupVideoRelations = relations(schema.groupVideos, ({ one }) => ({
	group: one(schema.groups, {
		fields: [schema.groupVideos.groupId],
		references: [schema.groups.id],
	}),
	video: one(schema.videos, {
		fields: [schema.groupVideos.videoId],
		references: [schema.videos.id],
	}),
}));

/**
 * 👥📔 Relaciones Group-Album
 */
export const groupAlbumRelations = relations(schema.groupAlbums, ({ one }) => ({
	group: one(schema.groups, {
		fields: [schema.groupAlbums.groupId],
		references: [schema.groups.id],
	}),
	album: one(schema.albums, {
		fields: [schema.groupAlbums.albumId],
		references: [schema.albums.id],
	}),
}));

/**
 * 👥🏷️ Relaciones Group-Tag
 */
export const groupTagRelations = relations(schema.groupTags, ({ one }) => ({
	group: one(schema.groups, {
		fields: [schema.groupTags.groupId],
		references: [schema.groups.id],
	}),
	tag: one(schema.tags, {
		fields: [schema.groupTags.tagId],
		references: [schema.tags.id],
	}),
}));

// =================================================================================
// EXPORTACIÓN COMPLETA DE RELACIONES
// =================================================================================

export const allRelations = {
	// Entidades principales
	profileRelations,
	settingsRelations,
	folderRelations,
	imageRelations,
	videoRelations,
	audioRelations,
	documentRelations,
	jsonFileRelations,
	file3DRelations,
	fileRelations,
	albumRelations,
	collectionRelations,
	tagRelations,
	propertyRelations,
	wildcardRelations,
	characterRelations,
	placeRelations,
	worldItemRelations,
	conceptRelations,
	promptRelations,
	noteRelations,
	groupRelations,

	// Tablas auxiliares
	imageStatsRelations,
	activityRelations,
	uploadedImageRelations,
	metadataRelations,
	thumbnailRelations,
	favoriteRelations,

	// Tablas many-to-many
	imageAlbumRelations,
	videoAlbumRelations,
	imageCollectionRelations,
	videoCollectionRelations,
	imageTagRelations,
	videoTagRelations,
	imagePropertyRelations,
	videoPropertyRelations,
	imageWildcardRelations,
	videoWildcardRelations,
	imageCharacterRelations,
	videoCharacterRelations,
	imagePlaceRelations,
	videoPlaceRelations,
	imageWorldItemRelations,
	videoWorldItemRelations,
	imageConceptRelations,
	videoConceptRelations,
	imagePromptRelations,
	videoPromptRelations,
	imageNoteRelations,
	videoNoteRelations,
	groupImageRelations,
	groupVideoRelations,
	groupAlbumRelations,
	groupTagRelations,
};
