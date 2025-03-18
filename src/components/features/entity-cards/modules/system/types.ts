/**
 * 🧩 Tipos para el módulo de sistema de Entity Cards
 */

import type { EntityType } from '@/types/entities';

/**
 * Configuración del sistema de rareza
 */
export interface RaritySystemConfig {
	enabled: boolean;
	defaultRarity: string;
	customRarities: Record<
		string,
		{
			name: string;
			color: string;
			borderColor: string;
			backgroundColor: string;
			textColor: string;
			glowColor: string;
			glowIntensity: number;
		}
	>;
}

/**
 * Configuración del sistema de texturas
 */
export interface TextureSystemConfig {
	enabled: boolean;
	defaultTexture: string;
	customTextures: Record<
		string,
		{
			name: string;
			url: string;
			opacity: number;
			blendMode: string;
		}
	>;
}

/**
 * Configuración del sistema de categorías
 */
export interface CategorySystemConfig {
	enabled: boolean;
	defaultCategory: string;
	customCategories: Record<
		string,
		{
			name: string;
			icon: string;
			color: string;
		}
	>;
}

/**
 * Configuración completa del sistema
 */
export interface SystemConfig {
	rarity: RaritySystemConfig;
	texture: TextureSystemConfig;
	category: CategorySystemConfig;
	entityTypeConfigs: Record<
		EntityType,
		{
			enableRarity: boolean;
			enableTexture: boolean;
			enableCategory: boolean;
		}
	>;
}

/**
 * Props para el módulo de sistema
 */
export interface SystemModuleProps {
	config?: Partial<SystemConfig>;
	onChange?: (config: SystemConfig) => void;
	entityType?: EntityType;
}

/**
 * Props para el panel de sistema
 */
export interface SystemPanelProps {
	config: SystemConfig;
	onChange: (config: SystemConfig) => void;
	entityType?: EntityType;
}

/**
 * Contexto del sistema
 */
export interface SystemContextType {
	config: SystemConfig;
	updateConfig: (config: Partial<SystemConfig>) => void;
	getRarityForEntity: (entityId: string, entityType: EntityType) => string;
	getTextureForEntity: (entityId: string, entityType: EntityType) => string;
	getCategoryForEntity: (entityId: string, entityType: EntityType) => string;
}

/**
 * Configuración por defecto del sistema
 */
export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
	rarity: {
		enabled: true,
		defaultRarity: 'common',
		customRarities: {
			common: {
				name: 'Común',
				color: '#cccccc',
				borderColor: '#aaaaaa',
				backgroundColor: '#f5f5f5',
				textColor: '#333333',
				glowColor: '#ffffff',
				glowIntensity: 0,
			},
			rare: {
				name: 'Raro',
				color: '#4287f5',
				borderColor: '#2563eb',
				backgroundColor: '#eff6ff',
				textColor: '#1e40af',
				glowColor: '#93c5fd',
				glowIntensity: 2,
			},
			epic: {
				name: 'Épico',
				color: '#9333ea',
				borderColor: '#7e22ce',
				backgroundColor: '#f5f3ff',
				textColor: '#6b21a8',
				glowColor: '#c4b5fd',
				glowIntensity: 3,
			},
			legendary: {
				name: 'Legendario',
				color: '#f59e0b',
				borderColor: '#d97706',
				backgroundColor: '#fffbeb',
				textColor: '#b45309',
				glowColor: '#fcd34d',
				glowIntensity: 4,
			},
		},
	},
	texture: {
		enabled: true,
		defaultTexture: 'none',
		customTextures: {
			none: {
				name: 'Ninguna',
				url: '',
				opacity: 0,
				blendMode: 'normal',
			},
			paper: {
				name: 'Papel',
				url: '/textures/paper.jpg',
				opacity: 0.2,
				blendMode: 'overlay',
			},
			metal: {
				name: 'Metal',
				url: '/textures/metal.jpg',
				opacity: 0.3,
				blendMode: 'overlay',
			},
			fabric: {
				name: 'Tela',
				url: '/textures/fabric.jpg',
				opacity: 0.15,
				blendMode: 'multiply',
			},
		},
	},
	category: {
		enabled: true,
		defaultCategory: 'default',
		customCategories: {
			default: {
				name: 'Por defecto',
				icon: 'tag',
				color: '#64748b',
			},
			favorite: {
				name: 'Favorito',
				icon: 'star',
				color: '#f59e0b',
			},
			important: {
				name: 'Importante',
				icon: 'alert-circle',
				color: '#ef4444',
			},
			archive: {
				name: 'Archivo',
				icon: 'archive',
				color: '#6b7280',
			},
		},
	},
	entityTypeConfigs: {
		folder: {
			enableRarity: true,
			enableTexture: true,
			enableCategory: true,
		},
		album: {
			enableRarity: true,
			enableTexture: true,
			enableCategory: true,
		},
		tag: {
			enableRarity: true,
			enableTexture: false,
			enableCategory: true,
		},
		image: {
			enableRarity: true,
			enableTexture: false,
			enableCategory: true,
		},
		video: {
			enableRarity: true,
			enableTexture: false,
			enableCategory: true,
		},
		collection: {
			enableRarity: true,
			enableTexture: true,
			enableCategory: true,
		},
	},
};
