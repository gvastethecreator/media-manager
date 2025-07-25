/**
 * =================================================================================
 * RELACIONES DRIZZLE ORM - ESQUEMA LIMPIO
 * =================================================================================
 * Este archivo define las relaciones básicas necesarias para que funcione el servidor.
 * =================================================================================
 */

import { relations } from 'drizzle-orm';
import {
  folders,
  images,
  videos,
  audios,
  documents,
  profiles,
  settings,
  imageStats,
  albums,
  collections,
  tags,
  imageAlbums,
  imageCollections,
  imageTags
} from './schema';

// =================================================================================
// RELACIONES BÁSICAS NECESARIAS
// =================================================================================

/**
 * 👤 Relaciones de Profile
 */
export const profileRelations = relations(profiles, ({ one }) => ({
  settings: one(settings, {
    fields: [profiles.settingsId],
    references: [settings.id],
  }),
  avatar: one(images, {
    fields: [profiles.imageId],
    references: [images.id],
  }),
}));

/**
 * ⚙️ Relaciones de Settings
 */
export const settingsRelations = relations(settings, ({ one }) => ({
  profile: one(profiles, {
    fields: [settings.profileId],
    references: [profiles.id],
  }),
}));

/**
 * 📁 Relaciones de Folder
 */
export const folderRelations = relations(folders, ({ one, many }) => ({
  parentFolder: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "FolderParent"
  }),
  subfolders: many(folders, { relationName: "FolderParent" }),
  images: many(images),
  videos: many(videos),
  audios: many(audios),
  documents: many(documents),
}));

/**
 * 🖼️ Relaciones de Image
 */
export const imageRelations = relations(images, ({ one, many }) => ({
  folder: one(folders, {
    fields: [images.folderId],
    references: [folders.id],
  }),
  stats: one(imageStats, {
    fields: [images.id],
    references: [imageStats.imageId],
  }),
  albums: many(imageAlbums),
  collections: many(imageCollections),
  tags: many(imageTags),
}));

/**
 * 🎥 Relaciones de Video
 */
export const videoRelations = relations(videos, ({ one }) => ({
  folder: one(folders, {
    fields: [videos.folderId],
    references: [folders.id],
  }),
}));

/**
 * 🎵 Relaciones de Audio
 */
export const audioRelations = relations(audios, ({ one }) => ({
  folder: one(folders, {
    fields: [audios.folderId],
    references: [folders.id],
  }),
}));

/**
 * 📄 Relaciones de Document
 */
export const documentRelations = relations(documents, ({ one }) => ({
  folder: one(folders, {
    fields: [documents.folderId],
    references: [folders.id],
  }),
}));

/**
 * 📊 Relaciones de ImageStats
 */
export const imageStatsRelations = relations(imageStats, ({ one }) => ({
  image: one(images, {
    fields: [imageStats.imageId],
    references: [images.id],
  }),
}));

/**
 * 📦 Relaciones de Album
 */
export const albumRelations = relations(albums, ({ many }) => ({
  images: many(imageAlbums),
}));

/**
 * 🎨 Relaciones de Collection
 */
export const collectionRelations = relations(collections, ({ one, many }) => ({
  parent: one(collections, {
    fields: [collections.parentId],
    references: [collections.id],
    relationName: "CollectionParent"
  }),
  children: many(collections, { relationName: "CollectionParent" }),
  images: many(imageCollections),
}));

/**
 * 🏷️ Relaciones de Tag
 */
export const tagRelations = relations(tags, ({ many }) => ({
  images: many(imageTags),
}));

// Relaciones de tablas pivot
export const imageAlbumRelations = relations(imageAlbums, ({ one }) => ({
  image: one(images, {
    fields: [imageAlbums.A],
    references: [images.id],
  }),
  album: one(albums, {
    fields: [imageAlbums.B],
    references: [albums.id],
  }),
}));

export const imageCollectionRelations = relations(imageCollections, ({ one }) => ({
  image: one(images, {
    fields: [imageCollections.A],
    references: [images.id],
  }),
  collection: one(collections, {
    fields: [imageCollections.B],
    references: [collections.id],
  }),
}));

export const imageTagRelations = relations(imageTags, ({ one }) => ({
  image: one(images, {
    fields: [imageTags.A],
    references: [images.id],
  }),
  tag: one(tags, {
    fields: [imageTags.B],
    references: [tags.id],
  }),
}));
