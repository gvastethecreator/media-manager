/**
 * 🧩 Adaptador para el sistema de Entity Cards
 */

import { deepMerge } from '@/lib/utils';
import { EntityType } from '@/types/entities';
import { DEFAULT_SYSTEM_CONFIG, SystemConfig } from './types';

/**
 * Adapta las opciones de tarjeta para incluir configuraciones del sistema
 */
export function adaptCardOptionsWithSystemConfig(
	options: Record<string, any>,
	systemConfig: Partial<SystemConfig> = {},
	entityType?: EntityType,
	entityId?: string
): Record<string, any> {
	const config = deepMerge(DEFAULT_SYSTEM_CONFIG, systemConfig) as SystemConfig;

	// Si no hay tipo de entidad, devolvemos las opciones sin modificar
	if (!entityType) return options;

	const entityTypeConfig = config.entityTypeConfigs[entityType];

	// Si no hay configuración para este tipo de entidad, devolvemos las opciones sin modificar
	if (!entityTypeConfig) return options;

	// Aplicamos configuraciones de rareza si están habilitadas para este tipo de entidad
	let updatedOptions = { ...options };

	if (entityTypeConfig.enableRarity && config.rarity.enabled) {
		const rarityKey = entityId ? getRarityKeyForEntity(entityId, entityType, config) : config.rarity.defaultRarity;

		const rarityConfig = config.rarity.customRarities[rarityKey];

		if (rarityConfig) {
			updatedOptions = {
				...updatedOptions,
				borderColor: rarityConfig.borderColor,
				backgroundColor: rarityConfig.backgroundColor,
				textColor: rarityConfig.textColor,
				glowColor: rarityConfig.glowColor,
				glowIntensity: rarityConfig.glowIntensity,
				rarityKey,
			};
		}
	}

	// Aplicamos configuraciones de textura si están habilitadas para este tipo de entidad
	if (entityTypeConfig.enableTexture && config.texture.enabled) {
		const textureKey = entityId ? getTextureKeyForEntity(entityId, entityType, config) : config.texture.defaultTexture;

		const textureConfig = config.texture.customTextures[textureKey];

		if (textureConfig && textureConfig.url) {
			updatedOptions = {
				...updatedOptions,
				textureUrl: textureConfig.url,
				textureOpacity: textureConfig.opacity,
				textureBlendMode: textureConfig.blendMode,
				textureKey,
			};
		}
	}

	// Aplicamos configuraciones de categoría si están habilitadas para este tipo de entidad
	if (entityTypeConfig.enableCategory && config.category.enabled) {
		const categoryKey = entityId
			? getCategoryKeyForEntity(entityId, entityType, config)
			: config.category.defaultCategory;

		const categoryConfig = config.category.customCategories[categoryKey];

		if (categoryConfig) {
			updatedOptions = {
				...updatedOptions,
				categoryIcon: categoryConfig.icon,
				categoryColor: categoryConfig.color,
				categoryKey,
			};
		}
	}

	return updatedOptions;
}

/**
 * Obtiene la clave de rareza para una entidad específica
 * Esta función debería ser reemplazada por una implementación real que obtenga la rareza de la base de datos
 */
function getRarityKeyForEntity(entityId: string, entityType: EntityType, config: SystemConfig): string {
	// Aquí se implementaría la lógica para obtener la rareza de una entidad específica
	// Por ahora, devolvemos la rareza por defecto
	return config.rarity.defaultRarity;
}

/**
 * Obtiene la clave de textura para una entidad específica
 * Esta función debería ser reemplazada por una implementación real que obtenga la textura de la base de datos
 */
function getTextureKeyForEntity(entityId: string, entityType: EntityType, config: SystemConfig): string {
	// Aquí se implementaría la lógica para obtener la textura de una entidad específica
	// Por ahora, devolvemos la textura por defecto
	return config.texture.defaultTexture;
}

/**
 * Obtiene la clave de categoría para una entidad específica
 * Esta función debería ser reemplazada por una implementación real que obtenga la categoría de la base de datos
 */
function getCategoryKeyForEntity(entityId: string, entityType: EntityType, config: SystemConfig): string {
	// Aquí se implementaría la lógica para obtener la categoría de una entidad específica
	// Por ahora, devolvemos la categoría por defecto
	return config.category.defaultCategory;
}
