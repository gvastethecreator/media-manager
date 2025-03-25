'use server';

import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from 'next/cache';

// Importar nuevos tipos y transformers
import {
    toExtendedVisualPreset,
    toExtendedVisualPresets,
    toPrismaCreateInput,
    toPrismaUpdateInput
} from '@/transformers/visual-preset';
import type {
    VisualPresetBase,
    VisualPresetCreateInput,
    VisualPresetExtended,
    VisualPresetUpdateInput
} from '@/types/entities/visual-preset';

const logger = serverLogger.withContext('VisualPresetsActions');

// Definir constantes para revalidación
const REVALIDATE_PATHS = ['/settings', '/visual-presets'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	logger.info('🔄 Rutas revalidadas');
};

// Definir códigos de error
enum VisualPresetErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función para crear errores consistentes
const createVisualPresetError = (
	message: string,
	code: VisualPresetErrorCode = VisualPresetErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'VisualPresetError';
	Object.assign(error, { code, cause });
	return error;
};

/**
 * Función segura para el servidor que parsea JSON guardado como string
 */
function parseJsonConfigServer(jsonConfig?: string | null): Record<string, unknown> {
	try {
		if (!jsonConfig) return {};

		// Si el string comienza con "default_", devolver un objeto con la configuración por defecto
		if (jsonConfig.startsWith('default_')) {
			const configType = jsonConfig.replace('default_', '').replace('_config', '');
			return getDefaultConfig(configType);
		}

		// Intentar parsear como JSON normal
		return JSON.parse(jsonConfig) as Record<string, unknown>;
	} catch (error) {
		logger.error('❌ Error parseando configuración JSON:', error);
		return {};
	}
}

/**
 * Obtiene la configuración por defecto según el tipo
 */
function getDefaultConfig(configType: string): Record<string, unknown> {
	switch (configType) {
		case 'core':
			return {
				enabled: true,
				version: '1.0.0',
				mode: 'standard'
			};
		case 'design':
			return {
				preset: 'default',
				variant: 'default',
				aspectRatio: '1/1',
				cornerStyle: 'rounded',
				cornerRadius: 12,
				elevation: 2,
				shadowStyle: 'soft'
			};
		case 'animation':
			return {
				enabled: true,
				duration: 300,
				easing: 'ease-in-out'
			};
		case 'layer':
			return {
				order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
				spacing: 2
			};
		case 'backside':
			return {
				enabled: true,
				style: 'standard'
			};
		case 'effects':
			return {
				glow: true,
				shadow: true,
				reflection: false
			};
		case 'performance':
			return {
				quality: 'high',
				optimizeRendering: true
			};
		case 'ra':
		case 'rarity':
			return {
				enabled: true,
				system: 'standard'
			};
		case 'la':
		case 'layout':
			return {
				type: 'standard',
				padding: 16
			};
		case 'pe':
			return {
				quality: 'high',
				optimizeRendering: true
			};
		case 'ba':
			return {
				enabled: true,
				style: 'standard'
			};
		default:
			return {};
	}
}

/**
 * Obtiene todos los presets visuales disponibles
 * Opcionalmente se puede filtrar por categoría
 */
export async function getVisualPresets(category?: string): Promise<VisualPresetExtended[]> {
	try {
		const where = category ? { category } : {};

		const presets = await prisma.visualPreset.findMany({
			where,
			orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
		});

		// Convertir a tipo extendido con transformers
		return toExtendedVisualPresets(presets);
	} catch (error) {
		logger.error('❌ Error al obtener presets visuales:', error);
		throw createVisualPresetError('No se pudieron obtener los presets visuales', VisualPresetErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un preset visual por su ID
 */
export async function getVisualPresetById(id: string): Promise<VisualPresetExtended> {
	try {
		const preset = await prisma.visualPreset.findUnique({
			where: { id },
		});

		if (!preset) {
			throw createVisualPresetError('Preset visual no encontrado', VisualPresetErrorCode.NOT_FOUND);
		}

		// Convertir a tipo extendido con transformers
		return toExtendedVisualPreset(preset);
	} catch (error) {
		logger.error('❌ Error al obtener preset visual:', error);
		if (error instanceof Error && error.name === 'VisualPresetError') {
			throw error;
		}
		throw createVisualPresetError('No se pudo obtener el preset visual', VisualPresetErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene presets visuales filtrados por tipo de entidad
 */
export async function getVisualPresetsByEntityType(entityType: string): Promise<VisualPresetExtended[]> {
	try {
		// Normalizar el tipo de entidad para la consulta
		const normalizedType = entityType.endsWith('s') ? entityType : `${entityType}s`;
		const configField = `${normalizedType.toLowerCase()}Config`;

		// Buscar presets que tengan configuración específica para este tipo de entidad
		// o presets generales que sean compatibles con todos los tipos
		const presets = await prisma.visualPreset.findMany({
			where: {
				OR: [
					{ [configField]: { not: null } },
					{ category: 'general' }
				]
			},
			orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
		});

		// Convertir a tipo extendido con transformers
		return toExtendedVisualPresets(presets);
	} catch (error) {
		logger.error('❌ Error al obtener presets visuales por tipo de entidad:', error);
		throw createVisualPresetError(
			'No se pudieron obtener los presets visuales para este tipo de entidad',
			VisualPresetErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Guarda un preset visual (crea nuevo o actualiza existente)
 */
export async function saveVisualPreset(preset: VisualPresetCreateInput | VisualPresetUpdateInput): Promise<VisualPresetBase> {
	try {
		if ('id' in preset) {
			// Es una actualización
			const updateData = toPrismaUpdateInput(preset as VisualPresetUpdateInput);

			const existingPreset = await prisma.visualPreset.findUnique({
				where: { id: preset.id }
			});

			if (!existingPreset) {
				throw createVisualPresetError('Preset visual no encontrado', VisualPresetErrorCode.NOT_FOUND);
			}

			const updatedPreset = await prisma.visualPreset.update({
				where: { id: preset.id },
				data: updateData
			});

			// Emitir evento de actualización
			await emit({
				type: 'visualPresets:modified',
				data: { action: 'update', preset: updatedPreset }
			});

			await revalidateAllPaths();
			return updatedPreset;
		}

		// Es una creación
		const createData = toPrismaCreateInput(preset as VisualPresetCreateInput);

		const newPreset = await prisma.visualPreset.create({
			data: createData
		});

		// Emitir evento de creación
		await emit({
			type: 'visualPresets:modified',
			data: { action: 'create', preset: newPreset }
		});

		await revalidateAllPaths();
		return newPreset;
	} catch (error) {
		logger.error('❌ Error al guardar preset visual:', error);
		if (error instanceof Error && error.name === 'VisualPresetError') {
			throw error;
		}
		throw createVisualPresetError('No se pudo guardar el preset visual', VisualPresetErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un preset visual
 */
export async function deleteVisualPreset(id: string): Promise<{ success: boolean }> {
	try {
		// Verificar que existe
		const preset = await prisma.visualPreset.findUnique({
			where: { id }
		});

		if (!preset) {
			throw createVisualPresetError('Preset visual no encontrado', VisualPresetErrorCode.NOT_FOUND);
		}

		// No permitir eliminar presets por defecto del sistema
		if (preset.isDefault) {
			throw createVisualPresetError(
				'No se pueden eliminar presets por defecto del sistema',
				VisualPresetErrorCode.VALIDATION_ERROR
			);
		}

		// Eliminar el preset
		await prisma.visualPreset.delete({
			where: { id }
		});

		// Emitir evento de eliminación
		await emit({
			type: 'visualPresets:modified',
			data: { action: 'delete', presetId: id }
		});

		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		logger.error('❌ Error al eliminar preset visual:', error);
		if (error instanceof Error && error.name === 'VisualPresetError') {
			throw error;
		}
		throw createVisualPresetError('No se pudo eliminar el preset visual', VisualPresetErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Aplica un preset visual a una entidad
 */
export async function applyVisualPresetToEntity(
	entityType: string,
	entityId: string,
	presetId: string | null
): Promise<{ success: boolean }> {
	try {
		// Validar tipos de entidades soportados
		const supportedEntityTypes = [
			'folder', 'folders',
			'image', 'images',
			'album', 'albums',
			'collection', 'collections',
			'tag', 'tags',
			'character', 'characters',
			'place', 'places',
			'worldItem', 'worldItems',
			'concept', 'concepts',
			'note', 'notes',
			'prompt', 'prompts'
		];

		const normalizedType = entityType.endsWith('s') ? entityType : `${entityType}s`;

		if (!supportedEntityTypes.includes(normalizedType.toLowerCase())) {
			throw createVisualPresetError(
				`Tipo de entidad no soportado: ${entityType}`,
				VisualPresetErrorCode.VALIDATION_ERROR
			);
		}

		// Validar que la entidad existe
		const singularType = normalizedType.endsWith('s')
			? normalizedType.substring(0, normalizedType.length - 1)
			: normalizedType;

		const entityModel = prisma[singularType.toLowerCase() as keyof typeof prisma];
		if (!entityModel || typeof entityModel.findUnique !== 'function') {
			throw createVisualPresetError(
				`Tipo de entidad no implementado: ${entityType}`,
				VisualPresetErrorCode.VALIDATION_ERROR
			);
		}

		const entity = await (entityModel as any).findUnique({
			where: { id: entityId }
		});

		if (!entity) {
			throw createVisualPresetError('Entidad no encontrada', VisualPresetErrorCode.NOT_FOUND);
		}

		// Si el presetId es null, eliminar la asociación
		if (presetId === null) {
			// Actualizar metadatos para eliminar la referencia al preset
			await (entityModel as any).update({
				where: { id: entityId },
				data: {
					metadata: JSON.stringify({ visualPresetId: null })
				}
			});

			// Emitir evento de actualización
			await emit({
				type: `${normalizedType.toLowerCase()}:modified`,
				data: { action: 'update', entity, visualPresetId: null }
			});

			await revalidateAllPaths();
			return { success: true };
		}

		// Verificar que el preset existe
		const preset = await prisma.visualPreset.findUnique({
			where: { id: presetId }
		});

		if (!preset) {
			throw createVisualPresetError('Preset visual no encontrado', VisualPresetErrorCode.NOT_FOUND);
		}

		// Actualizar metadatos de la entidad para asociar el preset
		await (entityModel as any).update({
			where: { id: entityId },
			data: {
				metadata: JSON.stringify({ visualPresetId: presetId })
			}
		});

		// Emitir evento de actualización
		await emit({
			type: `${normalizedType.toLowerCase()}:modified`,
			data: { action: 'update', entity, visualPresetId: presetId }
		});

		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		logger.error('❌ Error al aplicar preset visual a entidad:', error);
		if (error instanceof Error && error.name === 'VisualPresetError') {
			throw error;
		}
		throw createVisualPresetError('No se pudo aplicar el preset visual a la entidad', VisualPresetErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo preset a partir de opciones de tarjeta
 */
export async function createPresetFromCardOptions(
	name: string,
	options: CardOptions,
	entityType: string,
	description?: string,
	isDefault = false
): Promise<VisualPresetBase> {
	try {
		// Normalizar tipo de entidad
		const normalizedType = entityType.endsWith('s') ? entityType : `${entityType}s`;
		const configField = `${normalizedType.toLowerCase()}Config`;

		// Preparar datos para el nuevo preset
		const presetData: VisualPresetCreateInput = {
			name,
			description: description || `Preset para ${normalizedType}`,
			category: normalizedType.toLowerCase(),
			isDefault,
			isPublic: true,
			author: 'system',
			tags: '[]',
			// Configurar los campos específicos de la entidad
			coreConfig: JSON.stringify(options.core || {}),
			designConfig: JSON.stringify(options.design || {}),
			animationConfig: JSON.stringify(options.animation || {}),
			layerConfig: JSON.stringify(options.layers || {}),
			backsideConfig: JSON.stringify(options.backside || {}),
			effectsConfig: JSON.stringify(options.effects || {}),
			[configField]: JSON.stringify(options.entity || {})
		};

		// Usar el transformer para preparar los datos
		const createData = toPrismaCreateInput(presetData);

		// Crear el nuevo preset
		const newPreset = await prisma.visualPreset.create({
			data: createData
		});

		// Emitir evento de creación
		await emit({
			type: 'visualPresets:modified',
			data: { action: 'create', preset: newPreset }
		});

		await revalidateAllPaths();
		return newPreset;
	} catch (error) {
		logger.error('❌ Error al crear preset desde opciones de tarjeta:', error);
		throw createVisualPresetError('No se pudo crear el preset visual', VisualPresetErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las opciones de tarjeta desde un preset visual
 */
export async function getCardOptionsFromPreset(
	presetId: string,
	entityType: string
): Promise<CardOptions> {
	try {
		const preset = await prisma.visualPreset.findUnique({
			where: { id: presetId }
		});

		if (!preset) {
			throw createVisualPresetError('Preset visual no encontrado', VisualPresetErrorCode.NOT_FOUND);
		}

		// Convertir el preset a opciones de tarjeta
		return convertPresetToCardOptions(preset, entityType);
	} catch (error) {
		logger.error('❌ Error al obtener opciones de tarjeta desde preset:', error);
		if (error instanceof Error && error.name === 'VisualPresetError') {
			throw error;
		}
		throw createVisualPresetError('No se pudieron obtener las opciones de tarjeta', VisualPresetErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Convierte un preset visual a opciones de tarjeta
 */
function convertPresetToCardOptions(preset: VisualPresetBase, entityType: string): CardOptions {
	// Normalizar tipo de entidad
	const normalizedType = entityType.endsWith('s') ? entityType : `${entityType}s`;
	const configField = `${normalizedType.toLowerCase()}Config` as keyof typeof preset;

	// Obtener configuraciones, parseando los JSON
	const coreConfig = parseJsonConfigServer(preset.coreConfig);
	const designConfig = parseJsonConfigServer(preset.designConfig);
	const animationConfig = parseJsonConfigServer(preset.animationConfig);
	const layerConfig = parseJsonConfigServer(preset.layerConfig);
	const backsideConfig = parseJsonConfigServer(preset.backsideConfig);
	const effectsConfig = parseJsonConfigServer(preset.effectsConfig);
	const entityConfig = parseJsonConfigServer(preset[configField] as string | null);

	// Construir objeto de opciones
	return {
		core: coreConfig,
		design: designConfig,
		animation: animationConfig,
		layers: layerConfig,
		backside: backsideConfig,
		effects: effectsConfig,
		entity: entityConfig,
		// Información sobre el preset
		preset: {
			id: preset.id,
			name: preset.name,
			category: preset.category,
			isDefault: preset.isDefault,
		}
	};
}
