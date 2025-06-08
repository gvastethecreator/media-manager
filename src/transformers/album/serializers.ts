/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
	type AlbumComplete,
	type AlbumCreateInput,
	AlbumSchema,
	type AlbumUpdateInput,
} from '@/types/entities/album/types';
import { validateFieldType, validateRequiredFields } from '@/utils/transformers/common';
import { handleTransformerError } from '@/utils/transformers/errors';
import { preparePrismaRelations, validateEntityRelations } from '@/utils/transformers/relations';

const logger = serverLogger.withContext('AlbumSerializer');

/**
 * 🔄 Serializa un Album para Prisma
 */
export function toPrismaAlbum(data: AlbumCreateInput | AlbumUpdateInput): AlbumCreateInput | AlbumUpdateInput {
	try {
		// Validar campos requeridos para creación
		if (!('id' in data)) {
			validateRequiredFields(data, ['name']);
		}

		// Validar tipos de datos
		validateFieldType(data.name, 'string', 'name');
		if (data.emoji) validateFieldType(data.emoji, 'string', 'emoji');
		if (data.color) validateFieldType(data.color, 'string', 'color');
		if (data.category) validateFieldType(data.category, 'string', 'category');

		// Ajustar los campos para alinear con el schema.prisma
		// Remover los campos que no están en el schema actual
		const sanitizedData: Record<string, any> = { ...data };

		// Usar la técnica de filtrado sin delete para evitar problemas de rendimiento
		const fieldsToRemove = ['type', 'isPublic', 'settings', 'metadata'];
		const sanitizedResult = Object.fromEntries(
			Object.entries(sanitizedData).filter(([key]) => !fieldsToRemove.includes(key))
		);

		// Preparar relaciones para Prisma
		const relations = preparePrismaRelations('Album', data);

		// Devolver el objeto tipado como se espera
		return {
			...sanitizedResult,
			...relations,
		} as AlbumCreateInput | AlbumUpdateInput;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Deserializa un Album desde Prisma con validación robusta
 */
export function fromPrismaAlbum(prismaAlbum: AlbumComplete): AlbumComplete {
	try {
		// 🔍 Validación exhaustiva de entrada - MEJORADA
		if (!prismaAlbum) {
			logger.error('❌ fromPrismaAlbum: Received null or undefined prismaAlbum');
			throw new Error('Album data is null or undefined');
		}

		// 🛡️ Verificar que prismaAlbum es un objeto válido
		if (typeof prismaAlbum !== 'object') {
			logger.error('❌ fromPrismaAlbum: Invalid data type for prismaAlbum', {
				actualType: typeof prismaAlbum,
				value: prismaAlbum,
			});
			throw new Error(`Expected object, received ${typeof prismaAlbum}`);
		}

		// 🔍 Validar ID requerido
		if (!prismaAlbum.id) {
			logger.error('❌ fromPrismaAlbum: Missing required id field', { prismaAlbum });
			throw new Error('Album ID is required but missing');
		}

		// 🔍 Validar nombre requerido con mejor manejo
		if (!prismaAlbum.name || typeof prismaAlbum.name !== 'string' || prismaAlbum.name.trim() === '') {
			logger.error('❌ fromPrismaAlbum: Invalid or missing name field', {
				albumId: prismaAlbum.id,
				name: prismaAlbum.name,
				nameType: typeof prismaAlbum.name,
			});
			throw new Error(`Album name is invalid: expected non-empty string, got ${typeof prismaAlbum.name}`);
		}

		// 🛡️ Validar tipos de datos críticos para evitar errores de transformación
		if (prismaAlbum.emoji && typeof prismaAlbum.emoji !== 'string') {
			logger.warn('⚠️ fromPrismaAlbum: Invalid emoji type, using fallback', {
				albumId: prismaAlbum.id,
				emojiType: typeof prismaAlbum.emoji,
			});
		}

		if (prismaAlbum.color && typeof prismaAlbum.color !== 'string') {
			logger.warn('⚠️ fromPrismaAlbum: Invalid color type, using fallback', {
				albumId: prismaAlbum.id,
				colorType: typeof prismaAlbum.color,
			});
		}

		// 📊 Manejar conteos de Prisma de forma segura
		const countsData = prismaAlbum._count || {};

		// 🛡️ Helper function para obtener un conteo seguro
		const getSafeCount = (value: unknown): number => {
			if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
				return value;
			}
			return 0;
		};

		// 🛡️ Garantizar estructura de conteos con fallbacks seguros
		const safeCounts = {
			images: getSafeCount((countsData as any)?.images),
			videos: getSafeCount((countsData as any)?.videos),
			collections: getSafeCount((countsData as any)?.collections),
			tags: getSafeCount((countsData as any)?.tags),
			characters: getSafeCount((countsData as any)?.characters),
			places: getSafeCount((countsData as any)?.places),
			worldItems: getSafeCount((countsData as any)?.worldItems),
			concepts: getSafeCount((countsData as any)?.concepts),
			prompts: getSafeCount((countsData as any)?.prompts),
			notes: getSafeCount((countsData as any)?.notes),
			wildcards: getSafeCount((countsData as any)?.wildcards),
			properties: getSafeCount((countsData as any)?.properties),
			groups: getSafeCount((countsData as any)?.groups),
		};

		// 🛡️ Funciones helper para validar y limpiar fechas
		const parseValidDate = (dateValue: unknown, fallback: Date = new Date()): Date => {
			if (!dateValue) return fallback;

			if (dateValue instanceof Date) {
				return Number.isNaN(dateValue.getTime()) ? fallback : dateValue;
			}

			if (typeof dateValue === 'string') {
				const parsed = new Date(dateValue);
				return Number.isNaN(parsed.getTime()) ? fallback : parsed;
			}

			logger.warn('⚠️ fromPrismaAlbum: Invalid date format, using fallback', {
				albumId: prismaAlbum.id,
				dateValue,
				dateType: typeof dateValue,
			});
			return fallback;
		};

		// 🛡️ Helper para validar relaciones y evitar errores de transformación - MEJORADO
		const safeMapRelation = <T extends { id: any }>(
			relationArray: T[] | null | undefined,
			relationName: string
		): { id: any }[] => {
			// 🔍 Verificar si la relación existe y es válida
			if (!relationArray) {
				logger.debug(`⚠️ fromPrismaAlbum: ${relationName} is null/undefined, using empty array`, {
					albumId: prismaAlbum.id,
					relationName,
				});
				return [];
			}

			if (!Array.isArray(relationArray)) {
				logger.warn(`⚠️ fromPrismaAlbum: ${relationName} is not an array, using empty array`, {
					albumId: prismaAlbum.id,
					relationName,
					actualType: typeof relationArray,
					value: relationArray,
				});
				return [];
			}

			// 🔍 Filtrar y mapear elementos válidos con mejor validación
			try {
				const validItems = relationArray
					.filter((item) => {
						if (!item || typeof item !== 'object') {
							logger.debug(`⚠️ fromPrismaAlbum: Invalid item in ${relationName}, skipping`, {
								albumId: prismaAlbum.id,
								relationName,
								item,
							});
							return false;
						}
						if (!item.id) {
							logger.debug(`⚠️ fromPrismaAlbum: Item missing id in ${relationName}, skipping`, {
								albumId: prismaAlbum.id,
								relationName,
								item,
							});
							return false;
						}
						return true;
					})
					.map((item) => ({ id: item.id }));

				logger.debug(`✅ fromPrismaAlbum: Successfully mapped ${relationName}`, {
					albumId: prismaAlbum.id,
					relationName,
					originalCount: relationArray.length,
					validCount: validItems.length,
				});

				return validItems;
			} catch (error) {
				logger.error(`❌ fromPrismaAlbum: Error mapping ${relationName}, using empty array`, {
					albumId: prismaAlbum.id,
					relationName,
					error: error instanceof Error ? error.message : String(error),
				});
				return [];
			}
		};

		// 🏗️ Construir objeto base con validación exhaustiva
		const baseAlbum = {
			id: prismaAlbum.id,
			name: prismaAlbum.name, // Ya validado como string
			emoji: typeof prismaAlbum.emoji === 'string' ? prismaAlbum.emoji : '',
			color: typeof prismaAlbum.color === 'string' ? prismaAlbum.color : '',
			description: typeof prismaAlbum.description === 'string' ? prismaAlbum.description : null,
			shortcut: typeof prismaAlbum.shortcut === 'string' ? prismaAlbum.shortcut : null,
			category: typeof prismaAlbum.category === 'string' ? prismaAlbum.category : '',
			sortBy: typeof prismaAlbum.sortBy === 'string' ? prismaAlbum.sortBy : '',
			filters: typeof prismaAlbum.filters === 'string' ? prismaAlbum.filters : '',
			featuredImage: typeof prismaAlbum.featuredImage === 'string' ? prismaAlbum.featuredImage : null,
			isFavorite: Boolean(prismaAlbum.isFavorite),
			createdAt: parseValidDate(prismaAlbum.createdAt, new Date(0)),
			updatedAt: parseValidDate(prismaAlbum.updatedAt, new Date(0)),
		};

		// Validar campos base si es necesario (puede ser opcional dependiendo de la confianza en los datos)
		// validateBaseEntity(baseAlbum);
		// validateUIFields(baseAlbum);
		// validateMetadataFields(baseAlbum);

		// 🏗️ Construir objeto completo con relaciones validadas
		const albumComplete: AlbumComplete = {
			...baseAlbum,
			images: safeMapRelation(prismaAlbum.images, 'images'),
			videos: safeMapRelation(prismaAlbum.videos, 'videos'),
			collections: safeMapRelation(prismaAlbum.collections, 'collections'),
			tags: safeMapRelation(prismaAlbum.tags, 'tags'),
			characters: safeMapRelation(prismaAlbum.characters, 'characters'),
			places: safeMapRelation(prismaAlbum.places, 'places'),
			worldItems: safeMapRelation(prismaAlbum.worldItems, 'worldItems'),
			concepts: safeMapRelation(prismaAlbum.concepts, 'concepts'),
			prompts: safeMapRelation(prismaAlbum.prompts, 'prompts'),
			notes: safeMapRelation(prismaAlbum.notes, 'notes'),
			wildcards: safeMapRelation(prismaAlbum.wildcards, 'wildcards'),
			properties: safeMapRelation(prismaAlbum.properties, 'properties'),
			groups: safeMapRelation(prismaAlbum.groups, 'groups'),
			_count: safeCounts,
		};

		// 📝 Log exitoso para debugging
		logger.debug(`✅ fromPrismaAlbum: Successfully transformed album ${baseAlbum.id}`, {
			albumId: baseAlbum.id,
			name: baseAlbum.name,
			relationCounts: {
				images: albumComplete.images?.length || 0,
				videos: albumComplete.videos?.length || 0,
				tags: albumComplete.tags?.length || 0,
			},
		});

		return albumComplete;
	} catch (error) {
		// Loguear el error con más contexto si es posible
		logger.error(`Error in fromPrismaAlbum for ID ${prismaAlbum?.id ?? 'unknown'}`, {
			error: error instanceof Error ? { name: error.name, message: error.message, cause: error.cause } : error,
		});
		// Re-lanzar el error consistentemente
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Valida un Album
 */
export function validateAlbum(data: unknown): AlbumComplete {
	try {
		const validated = AlbumSchema.parse(data);
		validateEntityRelations('Album', validated);
		return validated as AlbumComplete;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Extiende un Album con datos adicionales
 */
export async function extendAlbum(
	album: AlbumComplete,
	options: {
		includeRelations?: boolean;
		includeCount?: boolean;
		customFields?: string[];
	} = {}
): Promise<AlbumComplete> {
	try {
		const extended = { ...album };

		// Aquí puedes agregar lógica para cargar datos adicionales
		// basado en las opciones proporcionadas

		return extended;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Parsea filtros de Album
 */
export function parseAlbumFilters(filters: unknown): Record<string, unknown> {
	try {
		if (!filters || typeof filters !== 'object') {
			return {};
		}

		const parsed: Record<string, unknown> = {};
		const typedFilters = filters as Record<string, unknown>;

		// Procesar filtros específicos de Album
		if (typedFilters.search) {
			parsed.OR = [
				{ name: { contains: typedFilters.search as string, mode: 'insensitive' } },
				{ description: { contains: typedFilters.search as string, mode: 'insensitive' } },
			];
		}

		// Filtros de categoría
		if (typedFilters.categories && Array.isArray(typedFilters.categories) && typedFilters.categories.length) {
			parsed.category = { in: typedFilters.categories };
		}

		// Filtros de estado
		if (typedFilters.isFavorite !== undefined) {
			parsed.isFavorite = typedFilters.isFavorite;
		}

		// Eliminar filtros que no están en el schema actual
		const fieldsToRemove = ['isPublic', 'types'];
		const filteredParsed = Object.fromEntries(Object.entries(parsed).filter(([key]) => !fieldsToRemove.includes(key)));

		// Filtros de relaciones
		if (typedFilters.hasImages) {
			filteredParsed.images = { some: {} };
		}
		if (typedFilters.hasVideos) {
			filteredParsed.videos = { some: {} };
		}
		if (typedFilters.hasCollections) {
			filteredParsed.collections = { some: {} };
		}

		// Filtros de cantidad de items
		if (typedFilters.minItems !== undefined) {
			filteredParsed._count = {
				...((filteredParsed._count as Record<string, unknown>) || {}),
				images: { gte: typedFilters.minItems },
			};
		}
		if (typedFilters.maxItems !== undefined) {
			filteredParsed._count = {
				...((filteredParsed._count as Record<string, unknown>) || {}),
				images: { lte: typedFilters.maxItems },
			};
		}

		// Filtros de fecha
		const dateRange = typedFilters.dateRange as Record<string, unknown> | undefined;
		if (dateRange?.start) {
			filteredParsed.createdAt = {
				...((filteredParsed.createdAt as Record<string, unknown>) || {}),
				gte: dateRange.start,
			};
		}
		if (dateRange?.end) {
			filteredParsed.createdAt = {
				...((filteredParsed.createdAt as Record<string, unknown>) || {}),
				lte: dateRange.end,
			};
		}

		return filteredParsed;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * Genera un color por defecto basado en el nombre del álbum
 */
export function generateAlbumColor(name: string): string {
	try {
		if (!name) return '#3b82f6'; // Color por defecto

		// Inicializar componentes RGB
		let r = 0;
		let g = 0;
		let b = 0;

		// Generar color basado en el nombre
		for (let i = 0; i < name.length; i++) {
			const charCode = name.charCodeAt(i);
			if (i % 3 === 0) r = ((r + charCode) % 200) + 55; // Mantener entre 55-255
			if (i % 3 === 1) g = ((g + charCode) % 200) + 55;
			if (i % 3 === 2) b = ((b + charCode) % 200) + 55;
		}

		// Convertir a formato hexadecimal
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	} catch (error) {
		logger.error('Error generando color para álbum', { name, error });
		return '#3b82f6'; // Color por defecto en caso de error
	}
}

/**
 * Genera un emoji por defecto basado en el nombre y tipo del álbum
 */
export function generateAlbumEmoji(name: string, type?: string): string {
	try {
		// Emojis por categoría
		const categoryEmojis: Record<string, string[]> = {
			default: ['📁', '📂', '📑', '🗃️', '🗄️', '📚', '📒', '📓', '📔', '📕', '📗', '📘', '📙'],
			art: ['🎨', '🖌️', '🖼️', '🧩', '🪄', '🎭', '🎪'],
			photo: ['📸', '📷', '🏞️', '📱', '📹', '📽️', '🎬'],
			media: ['🎵', '🎧', '📺', '🎥', '🎞️', '🎬', '🎮'],
			nature: ['🌿', '🌳', '🌲', '🌱', '🍀', '🌺', '🌻', '🦋'],
			travel: ['✈️', '🗺️', '🧳', '🏖️', '🏝️', '🏔️', '🏰'],
			food: ['🍎', '🍕', '🍰', '🍩', '🍪', '🍷', '🍴'],
		};

		let selectedCategory = 'default';

		// Determinar categoría basada en el tipo o nombre
		if (type) {
			const lowerType = type.toLowerCase();
			for (const [category, _] of Object.entries(categoryEmojis)) {
				if (lowerType.includes(category)) {
					selectedCategory = category;
					break;
				}
			}
		} else if (name) {
			const lowerName = name.toLowerCase();
			for (const [category, _] of Object.entries(categoryEmojis)) {
				if (lowerName.includes(category)) {
					selectedCategory = category;
					break;
				}
			}
		}

		// Seleccionar emoji aleatorio de la categoría
		const emojis = categoryEmojis[selectedCategory] || categoryEmojis.default;
		const randomIndex = Math.floor(
			Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % emojis.length
		);

		return emojis[randomIndex];
	} catch (error) {
		logger.error('Error generando emoji para álbum', { name, type, error });
		return '📁'; // Emoji por defecto en caso de error
	}
}
