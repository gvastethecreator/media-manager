/**
 * =================================================================================
 * VALIDACIONES Y CONSTRAINTS ADICIONALES - DRIZZLE ORM
 * =================================================================================
 * Este archivo define validaciones adicionales, constraints y optimizaciones
 * para el esquema de Drizzle que van más allá de las definiciones básicas.
 *
 * ✅ UNIFICADO A SQLITE - Enero 2025
 * 🔧 VALIDACIONES COMPLETAS - Enero 2025
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check } from 'drizzle-orm/sqlite-core';

// =================================================================================
// CONSTRAINTS DE VALIDACIÓN
// =================================================================================

/**
 * 📏 Constraints de longitud para campos de texto
 */
export const TEXT_CONSTRAINTS = {
	// Nombres y títulos
	name: sql`length(name) BETWEEN 1 AND 255`,
	title: sql`length(title) BETWEEN 1 AND 500`,
	description: sql`length(description) <= 2000`,

	// Metadatos
	emoji: sql`length(emoji) BETWEEN 1 AND 10`,
	color: sql`color LIKE '#%' AND length(color) = 7`,
	category: sql`length(category) <= 100`,

	// Archivos
	path: sql`length(path) BETWEEN 1 AND 1000`,
	hash: sql`length(hash) = 64`, // SHA-256
	mimeType: sql`length(mimeType) BETWEEN 3 AND 100`,
	extension: sql`length(extension) BETWEEN 1 AND 20`,

	// URLs y referencias
	featuredImage: sql`featuredImage IS NULL OR (featuredImage LIKE 'http%' OR featuredImage LIKE 'data:%' OR featuredImage LIKE '/%')`,
};

/**
 * 🔢 Constraints de rango para campos numéricos
 */
export const NUMERIC_CONSTRAINTS = {
	// Tamaños de archivo (en bytes)
	fileSize: sql`size >= 0 AND size <= 107374182400`, // Máximo 100GB

	// Dimensiones de imagen/video
	width: sql`width > 0 AND width <= 32768`,
	height: sql`height > 0 AND height <= 32768`,

	// Duración de video/audio (en segundos)
	duration: sql`duration >= 0 AND duration <= 86400`, // Máximo 24 horas

	// Prioridades y contadores
	priority: sql`priority BETWEEN 0 AND 10`,
	accessCount: sql`accessCount >= 0`,

	// Calidad y compresión
	quality: sql`quality BETWEEN 1 AND 100`,

	// Contadores de estadísticas
	totalImages: sql`totalImages >= 0`,
	totalVideos: sql`totalVideos >= 0`,
	totalSize: sql`totalSize >= 0`,
};

/**
 * 📅 Constraints de fecha y tiempo
 */
export const DATE_CONSTRAINTS = {
	// Fechas de creación no pueden ser futuras
	createdAt: sql`createdAt <= (strftime('%s', 'now') * 1000)`,

	// Fechas de actualización deben ser >= creación
	updatedAt: sql`updatedAt >= createdAt`,

	// Fechas de acceso válidas
	lastAccessed: sql`lastAccessed IS NULL OR lastAccessed <= (strftime('%s', 'now') * 1000)`,
};

/**
 * 📧 Constraints de formato
 */
export const FORMAT_CONSTRAINTS = {
	// Email válido (básico)
	email: sql`email LIKE '%@%.%'`,

	// URL válida (básico)
	url: sql`url LIKE 'http%' OR url LIKE 'ftp%'`,

	// Color hexadecimal
	hexColor: sql`color LIKE '#%' AND length(color) = 7`,

	// Shortcut/hotkey válido
	shortcut: sql`shortcut IS NULL OR length(shortcut) BETWEEN 1 AND 10`,
};

/**
 * 📝 Constraints de contenido
 */
export const CONTENT_CONSTRAINTS = {
	// JSON válido
	validJson: sql`json_valid(metadata) = 1`,

	// Status válidos
	processingStatus: sql`processingStatus IN ('pending', 'processing', 'completed', 'failed')`,
	noteStatus: sql`status IN ('active', 'archived', 'deleted', 'draft')`,

	// Tipos de entidad válidos
	entityType: sql`entityType IN ('image', 'video', 'album', 'collection', 'tag', 'character', 'place', 'worldItem', 'concept', 'prompt', 'note', 'document', 'audio', 'jsonFile', 'file3d', 'folder', 'property', 'wildcard', 'group')`,

	// Tipos de archivo válidos
	fileType: sql`fileType IN ('image', 'video', 'audio', 'document', 'text', 'archive', 'code', 'executable', 'font', 'data', 'unknown')`,
};

// =================================================================================
// ÍNDICES OPTIMIZADOS ADICIONALES
// =================================================================================

/**
 * 🚀 Índices compuestos para consultas frecuentes
 */
export const COMPOSITE_INDEXES = {
	// Búsquedas por folder y fecha
	folderCreated: ['folderId', 'createdAt'],
	folderUpdated: ['folderId', 'updatedAt'],

	// Búsquedas por favoritos y fecha
	favoriteCreated: ['isFavorite', 'createdAt'],
	favoriteUpdated: ['isFavorite', 'updatedAt'],

	// Búsquedas por tipo y estado
	typeStatus: ['fileType', 'processingStatus'],
	entityTypeStatus: ['entityType', 'status'],

	// Búsquedas por categoría y fecha
	categoryCreated: ['category', 'createdAt'],
	categoryPriority: ['category', 'priority'],

	// Búsquedas por tamaño y tipo
	sizeType: ['size', 'fileType'],
	sizeCreated: ['size', 'createdAt'],
};

/**
 * 🎯 Índices parciales para optimización específica
 */
export const PARTIAL_INDEXES = {
	// Solo elementos favoritos
	favoritesOnly: {
		columns: ['id', 'createdAt'],
		where: sql`isFavorite = 1`,
	},

	// Solo elementos activos (no archivados)
	activeOnly: {
		columns: ['id', 'name', 'createdAt'],
		where: sql`isArchived = 0`,
	},

	// Solo archivos grandes (>100MB)
	largeFilesOnly: {
		columns: ['id', 'path', 'size'],
		where: sql`size > 104857600`,
	},

	// Solo elementos con errores de procesamiento
	processingErrorsOnly: {
		columns: ['id', 'processingError', 'updatedAt'],
		where: sql`processingStatus = 'failed'`,
	},

	// Solo elementos públicos
	publicOnly: {
		columns: ['id', 'name', 'createdAt'],
		where: sql`isPublic = 1`,
	},
};

// =================================================================================
// TRIGGERS PARA INTEGRIDAD DE DATOS
// =================================================================================

/**
 * 🔄 Triggers para mantener consistencia automática
 */
export const TRIGGERS = {
	// Actualizar contadores en álbumes cuando se agregan/quitan imágenes
	updateAlbumStats: sql`
		CREATE TRIGGER update_album_stats_after_image_insert
		AFTER INSERT ON _ImageToAlbum
		BEGIN
			UPDATE Album
			SET
				totalImages = (
					SELECT COUNT(*)
					FROM _ImageToAlbum
					WHERE B = NEW.B
				),
				lastImageAddedAt = (strftime('%s', 'now') * 1000),
				updatedAt = (strftime('%s', 'now') * 1000)
			WHERE id = NEW.B;
		END;

		CREATE TRIGGER update_album_stats_after_image_delete
		AFTER DELETE ON _ImageToAlbum
		BEGIN
			UPDATE Album
			SET
				totalImages = (
					SELECT COUNT(*)
					FROM _ImageToAlbum
					WHERE B = OLD.B
				),
				updatedAt = (strftime('%s', 'now') * 1000)
			WHERE id = OLD.B;
		END;
	`,

	// Actualizar contadores en carpetas cuando se agregan/quitan archivos
	updateFolderStats: sql`
		CREATE TRIGGER update_folder_stats_after_image_insert
		AFTER INSERT ON Image
		BEGIN
			UPDATE Folder
			SET
				totalFiles = (
					SELECT COUNT(*)
					FROM (
						SELECT id FROM Image WHERE folderId = NEW.folderId
						UNION ALL
						SELECT id FROM Video WHERE folderId = NEW.folderId
						UNION ALL
						SELECT id FROM Audio WHERE folderId = NEW.folderId
						UNION ALL
						SELECT id FROM Document WHERE folderId = NEW.folderId
					)
				),
				totalSize = (
					SELECT COALESCE(SUM(size), 0)
					FROM (
						SELECT size FROM Image WHERE folderId = NEW.folderId
						UNION ALL
						SELECT size FROM Video WHERE folderId = NEW.folderId
						UNION ALL
						SELECT size FROM Audio WHERE folderId = NEW.folderId
						UNION ALL
						SELECT size FROM Document WHERE folderId = NEW.folderId
					)
				),
				updatedAt = (strftime('%s', 'now') * 1000)
			WHERE id = NEW.folderId;
		END;
	`,

	// Limpiar registros huérfanos en tablas de relación
	cleanupOrphanedRelations: sql`
		CREATE TRIGGER cleanup_orphaned_image_albums
		AFTER DELETE ON Image
		BEGIN
			DELETE FROM _ImageToAlbum WHERE A = OLD.id;
		END;

		CREATE TRIGGER cleanup_orphaned_video_albums
		AFTER DELETE ON Video
		BEGIN
			DELETE FROM _VideoToAlbum WHERE A = OLD.id;
		END;
	`,
};

// =================================================================================
// VISTAS OPTIMIZADAS
// =================================================================================

/**
 * 👁️ Vistas para consultas complejas frecuentes
 */
export const OPTIMIZED_VIEWS = {
	// Vista de estadísticas por carpeta
	folderStats: sql`
		CREATE VIEW IF NOT EXISTS FolderStatsView AS
		SELECT
			f.id,
			f.name,
			f.path,
			COUNT(DISTINCT i.id) as imageCount,
			COUNT(DISTINCT v.id) as videoCount,
			COUNT(DISTINCT a.id) as audioCount,
			COUNT(DISTINCT d.id) as documentCount,
			COALESCE(SUM(i.size), 0) + COALESCE(SUM(v.size), 0) +
			COALESCE(SUM(a.size), 0) + COALESCE(SUM(d.size), 0) as totalSize,
			f.createdAt,
			f.updatedAt
		FROM Folder f
		LEFT JOIN Image i ON f.id = i.folderId
		LEFT JOIN Video v ON f.id = v.folderId
		LEFT JOIN Audio a ON f.id = a.folderId
		LEFT JOIN Document d ON f.id = d.folderId
		GROUP BY f.id;
	`,

	// Vista de elementos favoritos con metadatos
	favoritesWithMetadata: sql`
		CREATE VIEW IF NOT EXISTS FavoritesWithMetadataView AS
		SELECT
			f.id,
			f.entityType,
			f.entityId,
			f.addedAt,
			f.category,
			f.priority,
			CASE f.entityType
				WHEN 'image' THEN (SELECT name FROM Image WHERE id = f.entityId)
				WHEN 'video' THEN (SELECT name FROM Video WHERE id = f.entityId)
				WHEN 'album' THEN (SELECT name FROM Album WHERE id = f.entityId)
				WHEN 'collection' THEN (SELECT name FROM Collection WHERE id = f.entityId)
				ELSE 'Unknown'
			END as entityName,
			CASE f.entityType
				WHEN 'image' THEN (SELECT path FROM Image WHERE id = f.entityId)
				WHEN 'video' THEN (SELECT path FROM Video WHERE id = f.entityId)
				ELSE NULL
			END as entityPath
		FROM Favorite f;
	`,

	// Vista de actividad reciente
	recentActivity: sql`
		CREATE VIEW IF NOT EXISTS RecentActivityView AS
		SELECT
			'image' as entityType,
			id as entityId,
			name,
			createdAt as activityDate,
			'created' as activityType
		FROM Image
		WHERE createdAt > (strftime('%s', 'now', '-7 days') * 1000)
		UNION ALL
		SELECT
			'video' as entityType,
			id as entityId,
			name,
			createdAt as activityDate,
			'created' as activityType
		FROM Video
		WHERE createdAt > (strftime('%s', 'now', '-7 days') * 1000)
		ORDER BY activityDate DESC;
	`,
};

// =================================================================================
// FUNCIONES DE UTILIDAD PARA APLICAR CONSTRAINTS
// =================================================================================

/**
 * 🛠️ Función para aplicar todos los constraints a una tabla
 */
export function applyConstraints(tableName: string, constraints: Record<string, any>) {
	const checks = Object.entries(constraints).map(([field, constraint]) =>
		check(`${tableName}_${field}_check`, constraint)
	);
	return checks;
}

/**
 * 📊 Función para crear índices compuestos
 */
export function createCompositeIndex(tableName: string, indexName: string, columns: string[]) {
	return sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(`${tableName}_${indexName}_idx`)} ON ${sql.identifier(tableName)} (${sql.join(columns.map(col => sql.identifier(col)), sql`, `)})`;
}

/**
 * 🎯 Función para crear índices parciales
 */
export function createPartialIndex(tableName: string, indexName: string, columns: string[], whereClause: any) {
	return sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(`${tableName}_${indexName}_idx`)} ON ${sql.identifier(tableName)} (${sql.join(columns.map(col => sql.identifier(col)), sql`, `)}) WHERE ${whereClause}`;
}

// =================================================================================
// CONFIGURACIÓN DE PRAGMAS PARA OPTIMIZACIÓN
// =================================================================================

/**
 * ⚡ Configuración de SQLite para máximo rendimiento
 */
export const SQLITE_OPTIMIZATIONS = {
	// Configuración de WAL para mejor concurrencia
	walMode: sql`PRAGMA journal_mode = WAL`,

	// Sincronización normal para balance rendimiento/seguridad
	syncNormal: sql`PRAGMA synchronous = NORMAL`,

	// Cache grande para mejor rendimiento
	cacheSize: sql`PRAGMA cache_size = 10000`,

	// Habilitar foreign keys
	foreignKeys: sql`PRAGMA foreign_keys = ON`,

	// Optimizar para consultas complejas
	queryPlanner: sql`PRAGMA optimize`,

	// Configuración de memoria temporal
	tempStore: sql`PRAGMA temp_store = MEMORY`,

	// Análisis automático de estadísticas
	autoAnalyze: sql`PRAGMA analysis_limit = 1000`,
};

/**
 * 🚀 Función para aplicar todas las optimizaciones
 */
export async function applyOptimizations(db: any) {
	const optimizations = Object.values(SQLITE_OPTIMIZATIONS);
	for (const optimization of optimizations) {
		try {
			await db.run(optimization);
		} catch (error) {
			console.warn('Error aplicando optimización:', error);
		}
	}
}