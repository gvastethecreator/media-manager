/**
 * @file Funciones para serializar y deserializar datos de propiedades
 * @module transformers/property/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { PropertyBase, PropertyWithRelations, PropertyWithStats } from '@/types/entities/property';
import { PropertySchema } from '@/types/entities/property';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma, Property } from '@prisma/client';

// Logger específico para este módulo
const logger = serverLogger.withContext('PropertyTransformer:Serializers');

// Constantes para valores por defecto
export const DEFAULT_PROPERTY_EMOJI = '🔍';
export const DEFAULT_PROPERTY_COLOR = '#3b82f6';

/**
 * Opciones para transformación de propiedades
 */
export interface PropertyTransformOptions {
	validateFields?: boolean;
	deserializeFields?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
	includeStats?: boolean;
}

/**
 * Valida un objeto Property contra su esquema
 * @param property - Objeto Property a validar
 * @returns El objeto validado o lanza un error
 */
export function validateProperty(property: Partial<PropertyBase>): PropertyBase {
	try {
		const _result = PropertySchema.parse(property);
		return property as PropertyBase;
	} catch (error) {
		logger.error('Error validando Property', { error });
		throw new TransformerError('Datos de Property inválidos');
	}
}

/**
 * Genera un emoji para la propiedad basado en su nombre y categoría
 * @param name Nombre de la propiedad
 * @param category Categoría de la propiedad
 * @returns Emoji adecuado para la propiedad
 */
export function generatePropertyEmoji(name: string, category?: string | null): string {
	// Normalizar nombre y categoría para búsqueda
	const normalizedName = name.toLowerCase();
	const normalizedCategory = category?.toLowerCase() || '';

	// Mapeo de categorías comunes a emojis
	if (normalizedName.includes('color') || normalizedName.includes('colour')) {
		return '🎨';
	}

	if (normalizedName.includes('size') || normalizedName.includes('dimension')) {
		return '📏';
	}

	if (normalizedName.includes('weight') || normalizedName.includes('mass')) {
		return '⚖️';
	}

	if (normalizedName.includes('time') || normalizedName.includes('date')) {
		return '⏱️';
	}

	if (normalizedName.includes('location') || normalizedName.includes('place')) {
		return '📍';
	}

	if (normalizedName.includes('material') || normalizedName.includes('substance')) {
		return '💎';
	}

	if (normalizedName.includes('quality') || normalizedName.includes('rating')) {
		return '⭐';
	}

	if (normalizedName.includes('price') || normalizedName.includes('cost')) {
		return '💰';
	}

	if (normalizedName.includes('author') || normalizedName.includes('creator')) {
		return '👤';
	}

	// Categorías específicas
	if (normalizedCategory === 'physical') {
		return '📦';
	}

	if (normalizedCategory === 'metadata') {
		return '📝';
	}

	if (normalizedCategory === 'technical') {
		return '⚙️';
	}

	// Valor predeterminado
	return DEFAULT_PROPERTY_EMOJI;
}

/**
 * Genera un color para la propiedad basado en su nombre
 * @param name Nombre de la propiedad
 * @returns Color en formato hexadecimal
 */
export function generatePropertyColor(name: string): string {
	// Lista de colores predefinidos
	const colors = [
		'#3b82f6', // blue
		'#ef4444', // red
		'#10b981', // green
		'#f59e0b', // amber
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#06b6d4', // cyan
		'#84cc16', // lime
		'#6366f1', // indigo
		'#14b8a6', // teal
		'#f97316', // orange
		'#d946ef', // fuchsia
	];

	// Calcular un valor hash simple basado en el nombre
	const hashValue = name.split('').reduce((acc, char) => {
		return acc + char.charCodeAt(0);
	}, 0);

	// Seleccionar un color basado en el hash
	return colors[hashValue % colors.length];
}

/**
 * Serializa una propiedad para Prisma
 * @param property Propiedad con campos JSON deserializados
 * @param options Opciones de transformación
 * @returns Propiedad con campos serializados para Prisma
 */
export function toPrismaProperty(
	property: Partial<PropertyWithRelations>,
	options: PropertyTransformOptions = {}
): Prisma.PropertyUpdateInput {
	try {
		const { validateFields = true } = options;

		// Validar datos si se solicita
		if (validateFields && Object.keys(property).length > 1) {
			validateProperty(property as PropertyBase);
		}

		// Crear objeto con solo propiedades válidas para Prisma
		const result: Prisma.PropertyUpdateInput = {
			id: property.id,
			name: property.name,
			emoji: property.emoji,
			color: property.color,
			description: property.description,
			shortcut: property.shortcut,
			category: property.category,
			featuredImage: property.featuredImage,
		};

		// Manejar la conversión de isFavorite a favorite si está presente
		if ('isFavorite' in property) {
			result.isFavorite = property.isFavorite;
		}

		return result;
	} catch (error) {
		logger.error('Error serializando property', { error });
		throw new TransformerError('Error serializando property');
	}
}

/**
 * Deserializa una propiedad desde Prisma
 * @param property Propiedad con campos serializados de Prisma
 * @param options Opciones de transformación
 * @returns Propiedad con campos deserializados
 */
export function fromPrismaProperty<T extends Property & { _count?: any }>(
	property: T | null
): PropertyWithStats | null {
	if (!property) return null;

	try {
		const base = {
			...property,
			isFavorite: property.isFavorite,
			createdAt: new Date(property.createdAt),
			updatedAt: new Date(property.updatedAt),
		};

		const totalAssociations = calculateItemCount(property);

		return {
			...base,
			totalAssociations,
		};
	} catch (error) {
		logger.error('Error deserializando property', { error });
		throw new TransformerError('Error deserializando property');
	}
}

/**
 * Calcula el número total de elementos vinculados a una propiedad
 * @param property Propiedad con posibles conteos
 * @returns Número total de elementos
 */
function calculateItemCount(property: Property & { _count?: any }): number {
	if (!property._count) return 0;

	return Object.values(property._count).reduce((total: number, count: any) => total + (count as number), 0);
}

/**
 * Extiende una propiedad con datos de interfaz de usuario
 * @param property Propiedad base
 * @returns Propiedad extendida con datos UI
 */
export function extendProperty<T extends PropertyBase>(
	property: T
): T & {
	_ui: {
		lastUpdated: Date;
		itemCount: number;
	};
} {
	return {
		...property,
		_ui: {
			lastUpdated: property.updatedAt,
			itemCount: 0, // Se requeriría acceso al campo _count para un valor real
		},
	};
}

/**
 * Extiende múltiples propiedades con datos de interfaz de usuario
 * @param properties Lista de propiedades
 * @returns Lista de propiedades con datos UI
 */
export function extendProperties(properties: PropertyBase[]): Array<ReturnType<typeof extendProperty>> {
	return properties.map((property) => extendProperty(property));
}

/**
 * Convierte una propiedad a formato simplificado para relaciones
 * @param property Propiedad con posibles conteos
 * @returns Propiedad formateada para relaciones
 */
export function toRelatedProperty(property: PropertyBase & { _count?: any }): {
	id: string;
	name: string;
	emoji: string;
	color: string;
	itemCount: number;
} {
	return {
		id: property.id,
		name: property.name,
		emoji: property.emoji,
		color: property.color,
		itemCount: calculateItemCount(property as any),
	};
}
