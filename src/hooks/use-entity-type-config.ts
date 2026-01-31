/**
 * @file Hook para trabajar con configuraciones de tipos de entidad
 * @module hooks/use-entity-type-config
 * @description Hook que proporciona acceso fácil a configuraciones, iconos, colores y utilidades
 *              para diferentes tipos de entidad
 */

import { useMemo } from 'react';
import {
	ENTITY_TYPE_CONFIGS,
	type EntityTypeConfig,
	getAllEntityTypes,
	getEntityTypeColor,
	getEntityTypeConfig,
	getEntityTypeDisplayName,
	getEntityTypeEmoji,
	getEntityTypeIcon,
	getEntityTypeSupportedOperations,
	isFormatSupported,
} from '@/config/entity-type-configs';
import { getCachedThumbnail } from '@/config/thumbnail-generators';
import { clientLogger } from '@/lib/logger/client-logger';
import type { AnyEntityWithStats } from '@/types/entities';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

/**
 * 🎯 Resultado del hook useEntityTypeConfig
 */
export interface UseEntityTypeConfigResult {
	/** Configuración completa del tipo de entidad */
	config: EntityTypeConfig | undefined;
	/** Color principal */
	color: string;
	/** Color secundario (si existe) */
	secondaryColor?: string;
	/** Icono de Lucide React */
	icon: React.ComponentType<any>;
	/** Nombre para mostrar */
	displayName: string;
	/** Nombre plural para mostrar */
	displayNamePlural: string;
	/** Emoji representativo */
	emoji: string;
	/** Operaciones soportadas */
	supportedOperations: string[];
	/** Metadatos específicos del tipo */
	metadata: Record<string, unknown>;
	/** Función para verificar si un formato es soportado */
	isFormatSupported: (format: string) => boolean;
	/** Función para generar thumbnail */
	generateThumbnail: (item: AnyEntityWithStats, options?: Record<string, any>) => Promise<string>;
}

/**
 * 🔧 Hook para trabajar con configuraciones de tipo de entidad
 */
export function useEntityTypeConfig(type: EntityStatsType): UseEntityTypeConfigResult {
	return useMemo(() => {
		const config = getEntityTypeConfig(type);

		return {
			config,
			color: getEntityTypeColor(type),
			secondaryColor: config?.secondaryColor,
			icon: getEntityTypeIcon(type),
			displayName: getEntityTypeDisplayName(type, false),
			displayNamePlural: getEntityTypeDisplayName(type, true),
			emoji: getEntityTypeEmoji(type),
			supportedOperations: getEntityTypeSupportedOperations(type),
			metadata: config?.metadata || {},
			isFormatSupported: (format: string) => isFormatSupported(type, format),
			generateThumbnail: (item: AnyEntityWithStats, options: Record<string, any> = {}) =>
				getCachedThumbnail(item, options),
		};
	}, [type]);
}

/**
 * 🎨 Hook para obtener todas las configuraciones de tipo
 */
export function useAllEntityTypeConfigs() {
	return useMemo(() => {
		const types = getAllEntityTypes();
		const configs = types.map((type) => {
			const config = getEntityTypeConfig(type);

			return {
				type,
				config,
				color: getEntityTypeColor(type),
				secondaryColor: config?.secondaryColor,
				icon: getEntityTypeIcon(type),
				displayName: getEntityTypeDisplayName(type, false),
				displayNamePlural: getEntityTypeDisplayName(type, true),
				emoji: getEntityTypeEmoji(type),
				supportedOperations: getEntityTypeSupportedOperations(type),
				metadata: config?.metadata || {},
				isFormatSupported: (format: string) => isFormatSupported(type, format),
				generateThumbnail: (item: AnyEntityWithStats, options: Record<string, any> = {}) =>
					getCachedThumbnail(item, options),
			};
		});

		return {
			types,
			configs,
			configsByType: ENTITY_TYPE_CONFIGS,
		};
	}, []);
}

/**
 * 🔍 Hook para detectar tipo de entidad desde un item
 */
export function useEntityTypeFromItem(item: AnyEntityWithStats | null) {
	return useMemo(() => {
		if (!item) {
			return {
				type: null,
				config: null,
				color: 'var(--dt-neutral-500)',
				secondaryColor: undefined,
				icon: getEntityTypeIcon(EntityStatsType.IMAGE),
				displayName: 'Elemento',
				displayNamePlural: 'Elementos',
				emoji: '📄',
				supportedOperations: [],
				metadata: {},
				isFormatSupported: () => false,
				generateThumbnail: async () => '',
			};
		}

		const type = item.entityType as EntityStatsType;
		const config = getEntityTypeConfig(type);

		return {
			type,
			config,
			color: getEntityTypeColor(type),
			secondaryColor: config?.secondaryColor,
			icon: getEntityTypeIcon(type),
			displayName: getEntityTypeDisplayName(type, false),
			displayNamePlural: getEntityTypeDisplayName(type, true),
			emoji: getEntityTypeEmoji(type),
			supportedOperations: getEntityTypeSupportedOperations(type),
			metadata: config?.metadata || {},
			isFormatSupported: (format: string) => isFormatSupported(type, format),
			generateThumbnail: (options: Record<string, any> = {}) => getCachedThumbnail(item, options),
		};
	}, [item]);
}

/**
 * 🎯 Hook para filtrar entidades por tipo
 */
export function useEntityTypeFilter() {
	return useMemo(() => {
		const allTypes = getAllEntityTypes();

		return {
			allTypes,
			filterByType: (items: AnyEntityWithStats[], types: EntityStatsType[]) => {
				return items.filter((item) => types.includes(item.entityType as EntityStatsType));
			},
			groupByType: (items: AnyEntityWithStats[]) => {
				const grouped: Record<EntityStatsType, AnyEntityWithStats[]> = {} as any;

				for (const item of items) {
					const type = item.entityType as EntityStatsType;
					if (!grouped[type]) {
						grouped[type] = [];
					}
					grouped[type].push(item);
				}

				return grouped;
			},
			getTypeStats: (items: AnyEntityWithStats[]) => {
				const stats: Record<EntityStatsType, number> = {} as any;

				for (const type of allTypes) {
					stats[type] = 0;
				}

				for (const item of items) {
					const type = item.entityType as EntityStatsType;
					if (stats[type] !== undefined) {
						stats[type]++;
					}
				}

				return stats;
			},
		};
	}, []);
}

/**
 * 🎨 Hook para trabajar con colores de entidad
 */
export function useEntityTypeColors() {
	return useMemo(() => {
		const configs = Object.values(ENTITY_TYPE_CONFIGS);

		return {
			colors: configs.map((config) => ({
				type: config.type,
				primary: config.color,
				secondary: config.secondaryColor,
				name: config.displayName,
			})),
			getColorForType: (type: EntityStatsType) => getEntityTypeColor(type),
			getGradientForType: (type: EntityStatsType) => {
				const config = getEntityTypeConfig(type);
				if (!config) {
					return `linear-gradient(135deg, ${getEntityTypeColor(type)}, #6b7280)`;
				}

				const primary = config.color;
				const secondary = config.secondaryColor || primary;
				return `linear-gradient(135deg, ${primary}, ${secondary})`;
			},
		};
	}, []);
}

/**
 * 🖼️ Hook para manejar thumbnails de entidades
 */
export function useEntityThumbnails() {
	return useMemo(() => {
		return {
			generateThumbnail: async (item: AnyEntityWithStats, options: Record<string, any> = {}): Promise<string> => {
				return getCachedThumbnail(item, options);
			},

			generateMultipleThumbnails: async (
				items: AnyEntityWithStats[],
				options: Record<string, any> = {}
			): Promise<Record<string, string>> => {
				const results: Record<string, string> = {};

				// Generar thumbnails en paralelo
				const promises = items.map(async (item) => {
					try {
						const thumbnail = await getCachedThumbnail(item, options);
						results[item.id] = thumbnail;
					} catch (error) {
						clientLogger.warn(`Error generando thumbnail para ${item.id}:`, error);
						results[item.id] = '';
					}
				});

				await Promise.all(promises);
				return results;
			},

			getThumbnailUrl: (item: AnyEntityWithStats, fallback = '') => {
				// Acceso rápido a thumbnail existente sin generación
				if ('thumbnailUrl' in item && typeof item.thumbnailUrl === 'string') {
					return item.thumbnailUrl;
				}

				return fallback;
			},
		};
	}, []);
}

/**
 * 📊 Hook para estadísticas de tipos de entidad
 */
export function useEntityTypeStats(items: AnyEntityWithStats[]) {
	return useMemo(() => {
		const stats = items.reduce(
			(acc, item) => {
				const type = item.entityType as EntityStatsType;
				acc[type] = (acc[type] || 0) + 1;
				return acc;
			},
			{} as Record<EntityStatsType, number>
		);

		const total = items.length;
		const typesWithItems = Object.keys(stats).length;

		const sortedStats = Object.entries(stats)
			.map(([type, count]) => ({
				type: type as EntityStatsType,
				count,
				percentage: total > 0 ? (count / total) * 100 : 0,
				config: getEntityTypeConfig(type as EntityStatsType),
			}))
			.sort((a, b) => b.count - a.count);

		return {
			stats,
			total,
			typesWithItems,
			sortedStats,
			mostCommonType: sortedStats[0]?.type || null,
			isEmpty: total === 0,
		};
	}, [items]);
}

/**
 * 🔍 Hook para búsqueda y filtrado por configuración
 */
export function useEntityTypeSearch() {
	return useMemo(() => {
		const allConfigs = Object.values(ENTITY_TYPE_CONFIGS);

		return {
			searchByName: (query: string) => {
				const lowerQuery = query.toLowerCase();
				return allConfigs.filter(
					(config) =>
						config.displayName.toLowerCase().includes(lowerQuery) ||
						config.displayNamePlural.toLowerCase().includes(lowerQuery)
				);
			},

			filterByCategory: (category: string) => {
				// Filtrar por metadatos específicos
				return allConfigs.filter((config) => {
					const metadata = config.metadata || {};
					return Object.values(metadata).some((value) => String(value).toLowerCase().includes(category.toLowerCase()));
				});
			},

			filterBySupport: (operation: string) => {
				return allConfigs.filter((config) => config.supportedOperations.includes(operation as any));
			},
		};
	}, []);
}
