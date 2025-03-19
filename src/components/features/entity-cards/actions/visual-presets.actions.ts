'use server';

import type { ActionResponse } from '@/components/features/entity-cards/modules/core/actions/entities-cards.actions';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { VisualPreset } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('VisualPresetsActions');

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

// Tipos específicos para presets visuales
export interface VisualPresetDto {
	id?: string;
	name: string;
	description?: string;
	category: string;
	isDefault?: boolean;
	isPublic?: boolean;
	author?: string;
	tags?: string[];
	metadata?: Record<string, unknown>;

	// Configuraciones serializadas
	coreConfig?: string;
	designConfig?: string;
	animationConfig?: string;
	layerConfig?: string;
	backsideConfig?: string;
	effectsConfig?: string;
	performanceConfig?: string;
	colorConfig?: string;
	imageGridConfig?: string;
	layoutConfig?: string;
	explodeConfig?: string;
	previewConfig?: string;
	rarityConfig?: string;

	// Configuraciones específicas por tipo de entidad
	folderConfig?: string;
	imageConfig?: string;
	videoConfig?: string;
	albumConfig?: string;
	tagConfig?: string;
	collectionConfig?: string;
	characterConfig?: string;
	placeConfig?: string;
	worldItemConfig?: string;
	conceptConfig?: string;
	promptConfig?: string;
	noteConfig?: string;
}

/**
 * Obtiene todos los presets visuales disponibles
 * Opcionalmente se puede filtrar por categoría
 */
export async function getVisualPresets(category?: string): Promise<ActionResponse> {
	try {
		const where = category ? { category } : {};

		const presets = await prisma.visualPreset.findMany({
			where,
			orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
		});

		return {
			success: true,
			message: 'Presets visuales obtenidos correctamente',
			data: presets,
		};
	} catch (error) {
		console.error('Error al obtener presets visuales:', error);
		return {
			success: false,
			message: 'No se pudieron obtener los presets visuales',
		};
	}
}

/**
 * Obtiene un preset visual por su ID
 */
export async function getVisualPresetById(id: string): Promise<ActionResponse> {
	try {
		const preset = await prisma.visualPreset.findUnique({
			where: { id },
		});

		if (!preset) {
			return {
				success: false,
				message: 'Preset visual no encontrado',
			};
		}

		return {
			success: true,
			message: 'Preset visual obtenido correctamente',
			data: preset,
		};
	} catch (error) {
		console.error('Error al obtener preset visual:', error);
		return {
			success: false,
			message: 'No se pudo obtener el preset visual',
		};
	}
}

/**
 * Obtiene los presets visuales por tipo de entidad
 */
export async function getVisualPresetsByEntityType(entityType: string): Promise<ActionResponse> {
	try {
		// Buscar presets con configuración específica para este tipo de entidad
		// o presets generales que se puedan aplicar a cualquier entidad
		const presets = await prisma.visualPreset.findMany({
			where: {
				OR: [{ category: entityType }, { category: 'general' }],
			},
			orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
		});

		return {
			success: true,
			message: `Presets visuales para ${entityType} obtenidos correctamente`,
			data: presets,
		};
	} catch (error) {
		console.error(`Error al obtener presets visuales para ${entityType}:`, error);
		return {
			success: false,
			message: `No se pudieron obtener los presets visuales para ${entityType}`,
		};
	}
}

/**
 * Crea o actualiza un preset visual
 */
export async function saveVisualPreset(preset: VisualPresetDto): Promise<ActionResponse> {
	try {
		let serializedTags = '[]';
		if (preset.tags && Array.isArray(preset.tags)) {
			serializedTags = JSON.stringify(preset.tags);
		}

		// Convertir metadata a string si es necesario
		let metadataStr = undefined;
		if (preset.metadata) {
			metadataStr = JSON.stringify(preset.metadata);
		}

		// Si tiene ID, actualizar el preset existente, sino crear uno nuevo
		if (preset.id) {
			const updatedPreset = await prisma.visualPreset.update({
				where: { id: preset.id },
				data: {
					name: preset.name,
					description: preset.description,
					category: preset.category,
					isDefault: preset.isDefault || false,
					isPublic: preset.isPublic || true,
					author: preset.author,
					tags: serializedTags,
					metadata: metadataStr,

					// Actualizar configuraciones
					coreConfig: preset.coreConfig,
					designConfig: preset.designConfig,
					animationConfig: preset.animationConfig,
					layerConfig: preset.layerConfig,
					backsideConfig: preset.backsideConfig,
					effectsConfig: preset.effectsConfig,
					performanceConfig: preset.performanceConfig,
					colorConfig: preset.colorConfig,
					imageGridConfig: preset.imageGridConfig,
					layoutConfig: preset.layoutConfig,
					explodeConfig: preset.explodeConfig,
					previewConfig: preset.previewConfig,
					rarityConfig: preset.rarityConfig,

					// Configuraciones específicas
					folderConfig: preset.folderConfig,
					imageConfig: preset.imageConfig,
					videoConfig: preset.videoConfig,
					albumConfig: preset.albumConfig,
					tagConfig: preset.tagConfig,
					collectionConfig: preset.collectionConfig,
					characterConfig: preset.characterConfig,
					placeConfig: preset.placeConfig,
					worldItemConfig: preset.worldItemConfig,
					conceptConfig: preset.conceptConfig,
					promptConfig: preset.promptConfig,
					noteConfig: preset.noteConfig,
				},
			});

			revalidatePath('/settings');

			return {
				success: true,
				message: 'Preset visual actualizado correctamente',
				data: updatedPreset,
			};
		}

		// Crear nuevo preset
		const newPreset = await prisma.visualPreset.create({
			data: {
				name: preset.name,
				description: preset.description,
				category: preset.category,
				isDefault: preset.isDefault || false,
				isPublic: preset.isPublic || true,
				author: preset.author,
				tags: serializedTags,
				metadata: metadataStr,

				// Configuraciones
				coreConfig: preset.coreConfig,
				designConfig: preset.designConfig,
				animationConfig: preset.animationConfig,
				layerConfig: preset.layerConfig,
				backsideConfig: preset.backsideConfig,
				effectsConfig: preset.effectsConfig,
				performanceConfig: preset.performanceConfig,
				colorConfig: preset.colorConfig,
				imageGridConfig: preset.imageGridConfig,
				layoutConfig: preset.layoutConfig,
				explodeConfig: preset.explodeConfig,
				previewConfig: preset.previewConfig,
				rarityConfig: preset.rarityConfig,

				// Configuraciones específicas
				folderConfig: preset.folderConfig,
				imageConfig: preset.imageConfig,
				videoConfig: preset.videoConfig,
				albumConfig: preset.albumConfig,
				tagConfig: preset.tagConfig,
				collectionConfig: preset.collectionConfig,
				characterConfig: preset.characterConfig,
				placeConfig: preset.placeConfig,
				worldItemConfig: preset.worldItemConfig,
				conceptConfig: preset.conceptConfig,
				promptConfig: preset.promptConfig,
				noteConfig: preset.noteConfig,
			},
		});

		revalidatePath('/settings');

		return {
			success: true,
			message: 'Preset visual creado correctamente',
			data: newPreset,
		};
	} catch (error) {
		console.error('Error al guardar preset visual:', error);
		return {
			success: false,
			message: 'No se pudo guardar el preset visual',
		};
	}
}

/**
 * Elimina un preset visual
 */
export async function deleteVisualPreset(id: string): Promise<ActionResponse> {
	try {
		// Verificar si el preset existe
		const existingPreset = await prisma.visualPreset.findUnique({
			where: { id },
		});

		if (!existingPreset) {
			return {
				success: false,
				message: 'Preset visual no encontrado',
			};
		}

		// Eliminar el preset
		await prisma.visualPreset.delete({
			where: { id },
		});

		revalidatePath('/settings');

		return {
			success: true,
			message: 'Preset visual eliminado correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar preset visual:', error);
		return {
			success: false,
			message: 'No se pudo eliminar el preset visual',
		};
	}
}

/**
 * Aplica un preset visual a una entidad
 * Esto actualiza el campo presetId de la entidad
 */
export async function applyVisualPresetToEntity(
	entityType: string,
	entityId: string,
	presetId: string | null
): Promise<ActionResponse> {
	try {
		// Definir el modelo a actualizar según el tipo de entidad
		let updatedEntity: Record<string, unknown> | null = null;

		switch (entityType) {
			case 'folder':
				updatedEntity = await prisma.folder.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'album':
				updatedEntity = await prisma.album.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'tag':
				updatedEntity = await prisma.tag.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'collection':
				updatedEntity = await prisma.collection.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'character':
				updatedEntity = await prisma.character.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'place':
				updatedEntity = await prisma.place.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'worldItem':
				updatedEntity = await prisma.worldItem.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'concept':
				updatedEntity = await prisma.concept.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'prompt':
				updatedEntity = await prisma.prompt.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'note':
				updatedEntity = await prisma.note.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			default:
				return {
					success: false,
					message: `Tipo de entidad ${entityType} no soportado`,
				};
		}

		// Revalidar rutas relevantes
		revalidatePath(`/${entityType}s`);
		revalidatePath(`/${entityType}/${entityId}`);

		return {
			success: true,
			message: presetId
				? `Preset visual aplicado correctamente a ${entityType}`
				: `Preset visual removido de ${entityType}`,
			data: updatedEntity,
		};
	} catch (error) {
		console.error(`Error al aplicar preset visual a ${entityType}:`, error);
		return {
			success: false,
			message: `No se pudo aplicar el preset visual a ${entityType}`,
		};
	}
}

/**
 * Crea un preset visual a partir de opciones de tarjeta
 */
export async function createPresetFromCardOptions(
	name: string,
	options: CardOptions,
	entityType: string,
	description?: string,
	isDefault = false
): Promise<ActionResponse> {
	try {
		// Extraer y serializar las diferentes configuraciones de las opciones
		const presetData: VisualPresetDto = {
			name,
			description,
			category: entityType,
			isDefault,

			// Serializar las configuraciones
			coreConfig: JSON.stringify(options.core || {}),
			designConfig: JSON.stringify(options.designSystem || {}),
			animationConfig: JSON.stringify(options.animation || {}),
			layerConfig: JSON.stringify(options.layers || {}),
			backsideConfig: JSON.stringify(options.backside || {}),
			effectsConfig: JSON.stringify(options.effects || {}),
			performanceConfig: JSON.stringify(options.performance || {}),
			colorConfig: JSON.stringify(options.colors || {}),
			imageGridConfig: JSON.stringify(options.imageGrid || {}),
			layoutConfig: JSON.stringify(options.layout || {}),
			explodeConfig: JSON.stringify(options.explode || {}),
			previewConfig: JSON.stringify(options.preview || {}),
			rarityConfig: JSON.stringify(options.raritySystem || {}),
		};

		// Guardar el preset
		return await saveVisualPreset(presetData);
	} catch (error) {
		console.error('Error al crear preset desde opciones de tarjeta:', error);
		return {
			success: false,
			message: 'No se pudo crear el preset visual desde las opciones de tarjeta',
		};
	}
}

/**
 * Obtiene la configuración de tarjeta a partir de un preset visual
 * @param presetId ID del preset visual
 * @param entityType Tipo de entidad para personalizar la configuración
 */
export async function getCardOptionsFromPreset(
	presetId: string,
	entityType: string
): Promise<ActionResponse> {
	try {
		logger.info(`🔄 Obteniendo configuración de preset ${presetId} para ${entityType}`);

		// Buscar el preset en la base de datos
		const preset = await prisma.visualPreset.findUnique({
			where: { id: presetId },
		});

		if (!preset) {
			return {
				success: false,
				message: 'Preset visual no encontrado',
			};
		}

		// Convertir el preset a opciones de tarjeta utilizables
		const cardOptions = convertPresetToCardOptions(preset, entityType);

		logger.info(`✅ Configuración de preset ${presetId} obtenida correctamente`);

		return {
			success: true,
			message: 'Configuración de preset obtenida correctamente',
			data: cardOptions,
		};
	} catch (error) {
		logger.error(`❌ Error obteniendo configuración de preset ${presetId}:`, error);
		return {
			success: false,
			message: 'Error al obtener la configuración del preset',
		};
	}
}

/**
 * Convierte el modelo VisualPreset en opciones de tarjeta utilizables (CardOptions)
 */
function convertPresetToCardOptions(preset: VisualPreset, entityType: string): CardOptions {
	// Opciones base para todos los presets
	const baseOptions: Record<string, unknown> = {};

	try {
		// Parsear diferentes configuraciones del preset con logging
		logger.info('🔄 Procesando configuraciones del preset...');

		// Core config
		if (preset.coreConfig) {
			logger.debug('Parseando coreConfig:', preset.coreConfig);
			baseOptions.core = parseJsonConfigServer(preset.coreConfig);
		}

		// Design config
		if (preset.designConfig) {
			logger.debug('Parseando designConfig:', preset.designConfig);
			baseOptions.designSystem = parseJsonConfigServer(preset.designConfig);
		}

		// Animation config
		if (preset.animationConfig) {
			logger.debug('Parseando animationConfig:', preset.animationConfig);
			baseOptions.animation = parseJsonConfigServer(preset.animationConfig);
		}

		// Layer config
		if (preset.layerConfig) {
			logger.debug('Parseando layerConfig:', preset.layerConfig);
			baseOptions.layers = parseJsonConfigServer(preset.layerConfig);
		}

		// Backside config
		if (preset.backsideConfig) {
			logger.debug('Parseando backsideConfig:', preset.backsideConfig);
			baseOptions.backside = parseJsonConfigServer(preset.backsideConfig);
		}

		// Effects config
		if (preset.effectsConfig) {
			logger.debug('Parseando effectsConfig:', preset.effectsConfig);
			baseOptions.effects = parseJsonConfigServer(preset.effectsConfig);
		}

		// Performance config
		if (preset.performanceConfig) {
			logger.debug('Parseando performanceConfig:', preset.performanceConfig);
			baseOptions.performance = parseJsonConfigServer(preset.performanceConfig);
		}

		// Color config
		if (preset.colorConfig) {
			logger.debug('Parseando colorConfig:', preset.colorConfig);
			baseOptions.colors = parseJsonConfigServer(preset.colorConfig);
		}

		// Image grid config
		if (preset.imageGridConfig) {
			logger.debug('Parseando imageGridConfig:', preset.imageGridConfig);
			baseOptions.imageGrid = parseJsonConfigServer(preset.imageGridConfig);
		}

		// Layout config
		if (preset.layoutConfig) {
			logger.debug('Parseando layoutConfig:', preset.layoutConfig);
			baseOptions.layout = parseJsonConfigServer(preset.layoutConfig);
		}

		// Explode config
		if (preset.explodeConfig) {
			logger.debug('Parseando explodeConfig:', preset.explodeConfig);
			baseOptions.explode = parseJsonConfigServer(preset.explodeConfig);
		}

		// Preview config
		if (preset.previewConfig) {
			logger.debug('Parseando previewConfig:', preset.previewConfig);
			baseOptions.preview = parseJsonConfigServer(preset.previewConfig);
		}

		// Rarity config
		if (preset.rarityConfig) {
			logger.debug('Parseando rarityConfig:', preset.rarityConfig);
			baseOptions.rarityConfig = parseJsonConfigServer(preset.rarityConfig);
		}

		// Aplicar configuraciones específicas según el tipo de entidad
		logger.info(`🔄 Aplicando configuración específica para tipo: ${entityType}`);

		// Configuración específica por tipo de entidad
		const entityConfigs: Record<string, string | null | undefined> = {
			folder: preset.folderConfig,
			album: preset.albumConfig,
			tag: preset.tagConfig,
			collection: preset.collectionConfig,
			character: preset.characterConfig,
			place: preset.placeConfig,
			worldItem: preset.worldItemConfig,
			concept: preset.conceptConfig,
			prompt: preset.promptConfig,
			note: preset.noteConfig,
		};

		const entityConfig = entityConfigs[entityType];
		if (entityConfig) {
			logger.debug(`Parseando configuración para ${entityType}:`, entityConfig);
			Object.assign(baseOptions, parseJsonConfigServer(entityConfig));
		}

		logger.info('✅ Conversión de preset completada exitosamente');
		return baseOptions as CardOptions;
	} catch (error) {
		logger.error('❌ Error en convertPresetToCardOptions:', error);
		// En caso de error, devolver opciones por defecto
		return getDefaultConfig('core') as CardOptions;
	}
}
