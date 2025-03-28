import { serverLogger } from '@/lib/logger/server-logger';
import type {
	VisualPresetBase,
	VisualPresetCreateInput,
	VisualPresetExtended,
	VisualPresetUpdateInput,
} from '@/types/entities/visual-preset';
import { processVisualPresetFields, serializeTags } from './serializers';

const mappersLogger = serverLogger.withContext('VisualPreset:Mappers');

/**
 * Mapea un preset visual a su versión extendida con campos procesados
 * @param preset Preset visual base
 * @returns Preset visual con campos procesados
 */
export function toExtendedVisualPreset(preset: VisualPresetBase): VisualPresetExtended {
	try {
		return processVisualPresetFields(preset);
	} catch (error) {
		mappersLogger.error('❌ Error mapeando a preset visual extendido:', error);
		return {
			...preset,
			parsedTags: [],
		};
	}
}

/**
 * Mapea un array de presets visuales a sus versiones extendidas
 * @param presets Array de presets visuales base
 * @returns Array de presets visuales con campos procesados
 */
export function toExtendedVisualPresets(presets: VisualPresetBase[]): VisualPresetExtended[] {
	return presets.map(toExtendedVisualPreset);
}

/**
 * Mapea datos de creación a un formato adecuado para el modelo de Prisma
 * @param data Datos para crear preset visual
 * @returns Datos formateados para Prisma
 */
export function toPrismaCreateInput(data: VisualPresetCreateInput): any {
	try {
		// Solo procesamos los tags, el resto son strings que Prisma maneja directamente
		return {
			...data,
			tags: data.tags ? data.tags : serializeTags([]),
		};
	} catch (error) {
		mappersLogger.error('❌ Error mapeando a input de creación para Prisma:', error);
		return data;
	}
}

/**
 * Mapea datos de actualización a un formato adecuado para el modelo de Prisma
 * @param data Datos para actualizar preset visual
 * @returns Datos formateados para Prisma
 */
export function toPrismaUpdateInput(data: VisualPresetUpdateInput): any {
	try {
		// Extraemos el ID y procesamos los tags si existen
		const { id, ...updateData } = data;

		return {
			...updateData,
			tags: data.tags ? data.tags : undefined,
		};
	} catch (error) {
		mappersLogger.error('❌ Error mapeando a input de actualización para Prisma:', error);
		// Extraemos solo el ID para evitar errores
		const { id } = data;
		return { id };
	}
}

/**
 * Genera una versión simplificada de un preset visual para listados
 * @param preset Preset visual extendido
 * @returns Versión simplificada para UI
 */
export function toVisualPresetListItem(preset: VisualPresetExtended) {
	return {
		id: preset.id,
		name: preset.name,
		description: preset.description,
		category: preset.category,
		isDefault: preset.isDefault,
		isPublic: preset.isPublic,
		version: preset.version,
		author: preset.author,
		tags: preset.parsedTags,
		createdAt: preset.createdAt,
		updatedAt: preset.updatedAt,
	};
}

/**
 * Mapea una lista de presets visuales a items de lista simplificados
 * @param presets Lista de presets visuales extendidos
 * @returns Lista de items simplificados
 */
export function toVisualPresetListItems(presets: VisualPresetExtended[]) {
	return presets.map(toVisualPresetListItem);
}
