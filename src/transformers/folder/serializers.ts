/**
 * @file Funciones de serialización para la entidad Folder
 * @module transformers/folder/serializers
 */

import { DEFAULT_COLORS, DEFAULT_EMOJIS } from '@/lib/constants';
import { serverLogger } from '@/lib/logger/server-logger';
import { FolderType } from '@/types/entities/folder/enums';
import type { Folder, FolderComplete, FolderStats, FolderWithStats } from '@/types/entities/folder/types';

const logger = serverLogger.withContext('FolderSerializers');

/**
 * 🎨 Genera un color aleatorio para una carpeta
 *
 * @returns Color en formato hexadecimal
 */
export function generateFolderColor(): string {
	try {
		const colors = [
			'#0EA5E9', // sky
			'#8B5CF6', // violet
			'#EC4899', // pink
			'#F59E0B', // amber
			'#10B981', // emerald
			'#6366F1', // indigo
			'#EF4444', // red
			'#84CC16', // lime
			'#8B5CF6', // violet
			'#64748B', // slate
		];

		return colors[Math.floor(Math.random() * colors.length)];
	} catch (error) {
		logger.error('Error generando color para folder:', error);
		return DEFAULT_COLORS.primary;
	}
}

/**
 * 📂 Genera un emoji aleatorio para una carpeta
 *
 * @returns Emoji como string
 */
export function generateFolderEmoji(): string {
	try {
		const emojis = ['📂', '📁', '🗂️', '📋', '📊', '📈', '📌', '📎', '🔍', '🔖', '📚'];
		return emojis[Math.floor(Math.random() * emojis.length)];
	} catch (error) {
		logger.error('Error generando emoji para folder:', error);
		return DEFAULT_EMOJIS.folder;
	}
}

/**
 * 📋 Normaliza un path de carpeta
 *
 * @param path Path a normalizar
 * @returns Path normalizado
 */
export function normalizeFolderPath(path: string): string {
	try {
		// Eliminar espacios en blanco
		let normalizedPath = path.trim();

		// Asegurar que comienza con /
		if (!normalizedPath.startsWith('/')) {
			normalizedPath = `/${normalizedPath}`;
		}

		// Eliminar barras duplicadas
		normalizedPath = normalizedPath.replace(/\/+/g, '/');

		// Eliminar barra final si existe
		if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
			normalizedPath = normalizedPath.slice(0, -1);
		}

		return normalizedPath;
	} catch (error) {
		logger.error('Error normalizando path de folder:', error);
		return path;
	}
}

/**
 * 📊 Extiende un folder con estadísticas
 *
 * @param folder Objeto folder
 * @returns Folder con estadísticas
 */
export function withFolderStats(folder: Folder): FolderWithStats {
	try {
		const stats: FolderStats = {
			totalImages: folder._count?.images || 0,
			totalUploadedImages: folder._count?.uploadedImages || 0,
			totalChildren: folder._count?.children || 0,
			totalTags: folder._count?.tags || 0,
			lastUpdated: folder.updatedAt,
			createdAt: folder.createdAt,
			level: calculateFolderLevel(folder.path),
			isRoot: folder.parentId === null,
			isEmpty: (folder._count?.images || 0) === 0 && (folder._count?.children || 0) === 0,
			hasChildren: (folder._count?.children || 0) > 0,
			size: calculateFolderSize(folder),
		};

		return {
			...folder,
			stats,
		};
	} catch (error) {
		logger.error('Error añadiendo estadísticas a folder:', error);
		return folder as FolderWithStats;
	}
}

/**
 * 📐 Calcula el nivel de una carpeta basado en su path
 *
 * @param path Path de la carpeta
 * @returns Nivel de profundidad
 */
function calculateFolderLevel(path: string): number {
	if (!path) return 0;
	// Contar el número de separadores / excepto el inicial
	const normalizedPath = normalizeFolderPath(path);
	return normalizedPath === '/' ? 0 : (normalizedPath.match(/\//g) || []).length;
}

/**
 * 📊 Calcula el tamaño aproximado de una carpeta
 *
 * @param folder Objeto folder
 * @returns Tamaño calculado
 */
function calculateFolderSize(folder: Folder): number {
	try {
		// Uso directo del campo totalSize si está disponible
		if (typeof folder.totalSize === 'number' && !Number.isNaN(folder.totalSize)) {
			return folder.totalSize;
		}

		// Si no hay totalSize pero hay un valor en _count mostraremos ese dato
		if (folder._count?.images) {
			// Tamaño estimado muy aproximado basado en la cantidad de imágenes
			// (podría mejorarse en el futuro con datos reales)
			return folder._count.images * 2000000; // ~2 MB por imagen como estimación
		}

		// Si no hay información disponible, devolver 0
		return 0;
	} catch (error) {
		logger.error('Error calculando tamaño de carpeta:', error);
		return 0;
	}
}

/**
 * 🔄 Normaliza el tipo de una carpeta
 *
 * @param type Tipo de carpeta
 * @returns Tipo normalizado
 */
export function normalizeFolderType(type?: string): FolderType {
	if (!type) return FolderType.STANDARD;

	try {
		// Convertir a mayúsculas y verificar si existe en el enum
		const normalizedType = type.toUpperCase();
		return Object.values(FolderType).includes(normalizedType as FolderType)
			? (normalizedType as FolderType)
			: FolderType.STANDARD;
	} catch (error) {
		logger.error('Error normalizando tipo de folder:', error);
		return FolderType.STANDARD;
	}
}

/**
 * 🔍 Parsea filtros de carpeta desde query params
 *
 * @param query Objeto de query
 * @returns Filtros para la carpeta
 */
export function parseFolderFilters(query: Record<string, any>): Record<string, any> {
	try {
		const filters: Record<string, any> = {};

		// Filtrar por nombre
		if (query.name) {
			filters.name = { contains: query.name, mode: 'insensitive' };
		}

		// Filtrar por path
		if (query.path) {
			filters.path = { contains: query.path };
		}

		// Filtrar por parent
		if (query.parentId) {
			filters.parentId = query.parentId === 'null' ? null : query.parentId;
		}

		return filters;
	} catch (error) {
		logger.error('Error parseando filtros de folder:', error);
		return {};
	}
}

/**
 * ✅ Valida un objeto folder
 *
 * @param folder Objeto folder para validar
 * @returns true si es válido, false si no
 */
export function validateFolder(folder: any): boolean {
	try {
		// Validaciones básicas
		if (!folder || typeof folder !== 'object') return false;
		if (!folder.id) return false;
		if (!folder.name) return false;

		return true;
	} catch (error) {
		logger.error('Error validando folder:', error);
		return false;
	}
}

/**
 * 🔄 Convierte un FolderComplete a una versión simplificada
 *
 * @param folder Objeto FolderComplete
 * @returns Objeto Folder simplificado
 */
export function fromFolderComplete(folder: FolderComplete): Folder {
	try {
		const { children, parent, stats, metadata, ...rest } = folder;
		return rest as Folder;
	} catch (error) {
		logger.error('Error convirtiendo de FolderComplete:', error);
		return folder as unknown as Folder;
	}
}

/**
 * 🔄 Convierte un objeto de Prisma a Folder
 *
 * @param prismaFolder Objeto de Prisma
 * @returns Objeto Folder
 */
export function fromPrismaFolder(prismaFolder: any): Folder {
	try {
		// Conversión básica
		return {
			id: prismaFolder.id,
			name: prismaFolder.name,
			path: prismaFolder.path,
			description: prismaFolder.description || '',
			color: prismaFolder.color || DEFAULT_COLORS.primary,
			emoji: prismaFolder.emoji || DEFAULT_EMOJIS.folder,
			parentId: prismaFolder.parentId,
			createdAt: prismaFolder.createdAt,
			updatedAt: prismaFolder.updatedAt,
			_count: prismaFolder._count || {
				children: 0,
				images: 0,
				uploadedImages: 0,
				tags: 0,
			},
		};
	} catch (error) {
		logger.error('Error convirtiendo de Prisma:', error);
		return prismaFolder as Folder;
	}
}

/**
 * 📂 Extiende un folder con propiedades adicionales
 *
 * @param folder Folder a extender
 * @returns FolderComplete con propiedades adicionales
 */
export function extendFolder(folder: FolderComplete): FolderComplete {
	try {
		// Log para depuración
		logger.debug('🔍 Extendiendo folder:', {
			id: folder.id,
			name: folder.name,
			totalSize: folder.totalSize,
			totalFiles: folder.totalFiles,
		});

		// Si ya tiene estadísticas, las mantenemos
		const folderWithStats = folder.stats ? folder : withFolderStats(folder);

		// Valores por defecto para propiedades no definidas
		return {
			...folderWithStats,
			name: folder.name || '',
			path: folder.path || '/',
			description: folder.description || '',
			color: folder.color || DEFAULT_COLORS.primary,
			emoji: folder.emoji || DEFAULT_EMOJIS.folder,
			metadata: folder.metadata || {},
			children: folder.children || [],
			// Preservar explícitamente totalSize y totalFiles
			totalSize: folder.totalSize || 0,
			totalFiles: folder.totalFiles || 0,
			_count: folder._count || {
				children: 0,
				images: 0,
				uploadedImages: 0,
				tags: 0,
			},
		};
	} catch (error) {
		logger.error('Error extendiendo folder:', error);
		return folder;
	}
}

/**
 * 🔄 Convierte un FolderComplete a un objeto RelatedFolder
 *
 * @param folder Objeto FolderComplete
 * @returns Objeto RelatedFolder
 */
export function toRelatedFolder(folder: FolderComplete): {
	id: string;
	name: string;
	emoji: string;
	color: string;
	type: string;
} {
	try {
		return {
			id: folder.id,
			name: folder.name,
			emoji: folder.emoji || DEFAULT_EMOJIS.folder,
			color: folder.color || DEFAULT_COLORS.primary,
			type: 'folder',
		};
	} catch (error) {
		logger.error('Error creando objeto RelatedFolder:', error);
		// Devolver un objeto básico en caso de error
		return {
			id: folder.id,
			name: folder.name || 'Folder',
			emoji: DEFAULT_EMOJIS.folder,
			color: DEFAULT_COLORS.primary,
			type: 'folder',
		};
	}
}
