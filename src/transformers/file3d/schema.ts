/**
 * @file Schema de Drizzle para la entidad File3D.
 * @module transformers/file3d/schema
 * @description Definición del schema de File3D usando Drizzle ORM.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * 🎯 Tabla de archivos 3D en la base de datos.
 *
 * @description Representa archivos de modelos 3D (OBJ, FBX, GLTF, etc.) con metadatos específicos.
 */
export const files3dTable = pgTable('files_3d', {
	// Identificación
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	filePath: text('file_path').notNull(),

	// Propiedades del archivo
	format: text('format').notNull(), // obj, fbx, gltf, blend, etc.
	size: integer('size').notNull(),

	// Metadatos 3D específicos
	vertexCount: integer('vertex_count'),
	faceCount: integer('face_count'),
	textureCount: integer('texture_count'),
	materialCount: integer('material_count'),

	// Geometría y límites
	boundingBoxMin: text('bounding_box_min'), // JSON string de coordenadas
	boundingBoxMax: text('bounding_box_max'), // JSON string de coordenadas

	// Características del modelo
	hasAnimations: boolean('has_animations').notNull().default(false),
	hasTextures: boolean('has_textures').notNull().default(false),
	hasMaterials: boolean('has_materials').notNull().default(false),

	// Optimización
	isOptimized: boolean('is_optimized').notNull().default(false),
	compressionLevel: integer('compression_level'), // 0-100

	// Vista previa
	thumbnail: text('thumbnail'), // Base64 o URL
	metadata: text('metadata'), // JSON con metadatos adicionales

	// Relaciones
	folderId: uuid('folder_id'),

	// Timestamps del sistema
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 📊 Tipo inferido de la tabla de archivos 3D.
 */
export type File3DSchema = typeof files3dTable.$inferSelect;

/**
 * 🆕 Tipo para insertar archivos 3D.
 */
export type File3DInsert = typeof files3dTable.$inferInsert;
