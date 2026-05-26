/**
 * @file Esquemas de validación para la entidad Folder
 * @module types/entities/folder/schema
 * @description Validaciones usando Zod para garantizar la integridad de los datos
 */

import { z } from 'zod';

/**
 * 📁 Schema base para una carpeta
 */
export const FolderBaseSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	name: z.string().min(1, 'El nombre es requerido').max(255, 'Nombre muy largo'),
	description: z.string().max(1000, 'Descripción muy larga').nullable(),
	path: z.string().min(1, 'La ruta es requerida'),
	emoji: z.string().max(10, 'Emoji muy largo').nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hex válido')
		.nullable(),
	featuredImage: z.string().url('Imagen destacada debe ser URL válida').nullable(),
	isFavorite: z.boolean().default(false),
	totalFiles: z.number().int().min(0, 'Total de archivos no puede ser negativo'),
	totalSize: z.number().int().min(0, 'Tamaño total no puede ser negativo'),
	lastIndexed: z.date().nullable(),
	parentId: z.string().uuid('Parent ID debe ser UUID válido').nullable(),
	presetId: z.string().uuid('Preset ID debe ser UUID válido').nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📁 Schema para crear una carpeta
 */
export const CreateFolderSchema = z.object({
	name: z
		.string()
		.min(1, 'El nombre es requerido')
		.max(255, 'El nombre no puede exceder 255 caracteres')
		.regex(/^[^<>:"/\\|?*]+$/, 'El nombre contiene caracteres no válidos'),
	description: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional().nullable(),
	path: z
		.string()
		.min(1, 'La ruta es requerida')
		.max(500, 'La ruta es muy larga')
		.regex(/^[^\0]+$/, 'La ruta contiene caracteres no válidos'),
	emoji: z.string().max(10, 'Emoji muy largo').optional().nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un valor hexadecimal válido')
		.optional()
		.nullable(),
	featuredImage: z.string().url('La imagen destacada debe ser una URL válida').optional().nullable(),
	parentId: z.string().uuid('El ID del padre debe ser un UUID válido').optional().nullable(),
	presetId: z.string().uuid('El ID del preset debe ser un UUID válido').optional().nullable(),
});

/**
 * 📁 Schema para actualizar una carpeta
 */
export const UpdateFolderSchema = z.object({
	name: z
		.string()
		.min(1, 'El nombre es requerido')
		.max(255, 'El nombre no puede exceder 255 caracteres')
		.regex(/^[^<>:"/\\|?*]+$/, 'El nombre contiene caracteres no válidos')
		.optional(),
	description: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').nullable().optional(),
	path: z
		.string()
		.min(1, 'La ruta es requerida')
		.max(500, 'La ruta es muy larga')
		.regex(/^[^\0]+$/, 'La ruta contiene caracteres no válidos')
		.optional(),
	emoji: z.string().max(10, 'Emoji muy largo').nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un valor hexadecimal válido')
		.nullable()
		.optional(),
	featuredImage: z.string().url('La imagen destacada debe ser una URL válida').nullable().optional(),
	parentId: z.string().uuid('El ID del padre debe ser un UUID válido').nullable().optional(),
	presetId: z.string().uuid('El ID del preset debe ser un UUID válido').nullable().optional(),
});

/**
 * 📁 Schema para estadísticas de carpeta
 */
export const FolderStatisticsSchema = z.object({
	hierarchyDepth: z.number().int().min(0),
	totalDescendants: z.number().int().min(0),
	directChildren: z.number().int().min(0),
	contentDiversity: z.number().min(0).max(100),
	organizationScore: z.number().min(0).max(100),
	totalItems: z.number().int().min(0),
	accessFrequency: z.number().min(0).max(100),
	lastActivity: z.date().nullable(),
	imageCount: z.number().int().min(0),
	videoCount: z.number().int().min(0),
	noteCount: z.number().int().min(0),
	documentCount: z.number().int().min(0),
	folderCount: z.number().int().min(0),
	formattedSize: z.string(),
	averageFileSize: z.number().min(0),
	largestFile: z.number().min(0),
	hasConsistentNaming: z.boolean(),
	hasDeepHierarchy: z.boolean(),
	isWellOrganized: z.boolean(),
	breadcrumbs: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			path: z.string(),
		})
	),
	fullPath: z.string(),
	relativePath: z.string(),
	autoTags: z.array(z.string()),
	qualityGrade: z.enum(['A', 'B', 'C', 'D']),
	totalRelations: z.number().int().min(0),
});

/**
 * 📁 Schema para FolderWithStats
 */
export const FolderWithStatsSchema = FolderBaseSchema.extend({
	stats: FolderStatisticsSchema,
	_count: z.object({
		children: z.number().int().min(0),
		images: z.number().int().min(0),
		videos: z.number().int().min(0),
		notes: z.number().int().min(0),
		documents: z.number().int().min(0),
	}),
});

/**
 * 📁 Schema para filtros de búsqueda
 */
export const FolderFiltersSchema = z.object({
	search: z.string().optional(),
	isFavorite: z.boolean().optional(),
	parentId: z.string().uuid().nullable().optional(),
	hasImages: z.boolean().optional(),
	hierarchyDepth: z.number().int().min(0).optional(),
	organizationScore: z
		.object({
			min: z.number().min(0).max(100).optional(),
			max: z.number().min(0).max(100).optional(),
		})
		.optional(),
});

/**
 * 📁 Schema para opciones de búsqueda
 */
export const FolderSearchOptionsSchema = z.object({
	skip: z.number().int().min(0).default(0).optional(),
	take: z.number().int().min(1).max(100).default(50).optional(),
	filters: FolderFiltersSchema.optional(),
	orderBy: z.enum(['name', 'date', 'size', 'organization']).default('name').optional(),
	order: z.enum(['asc', 'desc']).default('asc').optional(),
});

/**
 * 📁 Schema para mover carpeta
 */
export const MoveFolderSchema = z.object({
	folderId: z.string().uuid('ID de carpeta debe ser UUID válido'),
	newParentId: z.string().uuid('ID de padre debe ser UUID válido').nullable(),
});

// Tipos inferidos de los schemas
export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
export type UpdateFolderInput = z.infer<typeof UpdateFolderSchema>;
export type FolderFilters = z.infer<typeof FolderFiltersSchema>;
export type FolderSearchOptions = z.infer<typeof FolderSearchOptionsSchema>;
export type MoveFolderInput = z.infer<typeof MoveFolderSchema>;

// Funciones de validación helper
export const validateCreateFolder = (data: unknown) => CreateFolderSchema.parse(data);
export const validateUpdateFolder = (data: unknown) => UpdateFolderSchema.parse(data);
export const validateFolderFilters = (data: unknown) => FolderFiltersSchema.parse(data);
export const validateFolderSearchOptions = (data: unknown) => FolderSearchOptionsSchema.parse(data);
export const validateMoveFolder = (data: unknown) => MoveFolderSchema.parse(data);
