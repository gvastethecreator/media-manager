/**
 * Archivo centralizado para exportar todos los tipos relacionados con entity-cards
 * Esto facilita la importación y mantiene la consistencia en todo el sistema
 */

// Exportar tipos desde archivos específicos, evitando ambigüedades
export type { BaseCardProps } from './base-card-types';
export * from './card-layer-types';
// Eliminada exportación de card-settings-types, ahora unificado en unified-types
export * from './central-types';
export * from './character-card-types';
export * from './unified-card-types';
export * from './unified-types'; // Exportación adicional de los tipos unificados

// Exportar adaptador de opciones
export { toSharedCardOptions, toUnifiedCardOptions } from './card-options-adapter';

// Exportar selectivamente de base-card-types para evitar ambigüedades
import type * as BaseCardTypes from './base-card-types';

// Exportar selectivamente de shared-card-types
import type * as SharedCardTypes from './shared-card-types';

/**
 * Adaptador de tipos para convertir entre diferentes sistemas de tipos de CardOptions
 * Esta utilidad permite resolver incompatibilidades entre distintas versiones
 */
export const adaptCardOptions = <T = any>(options: any): T => {
	return options as T;
};

// Re-exportar interfaces comunes para facilitar su uso
export type {
	AnimationSystem,
	BacksideOptions,
	BorderOptions,
	CardInteractivity,
	CardOptions,
	CardPreset,
	CardStates,
	CardVariant,
	ColorPalette,
	CornerStyle,
	DesignSystem,
	GlowOptions,
	GrainOptions,
	HolographicOptions,
	LayersConfig,
	PerformanceOptions,
	ScanlinesOptions,
	ShadowStyle,
} from './unified-card-types';

// Re-exportar tipos de capas
export type {
	BaseLayerConfig,
	LayerComponentProps,
	LayerSettingsProps,
} from '../modules/layer-system/layers/layer-plugin-system';

// Re-exportar tipos de módulos
export type { AnimationSystem as AnimationSystemType } from '../modules/animation/types';
export type { BacksideOptions as BacksideOptionsType } from '../modules/backside/types';
export type { DesignSystem as DesignSystemType } from '../modules/design/types';

// Exportar tipos ambiguos con nombres diferentes
export type BaseCardRarityConfig = BaseCardTypes.RarityConfig;
export type BaseCardTextureConfig = BaseCardTypes.TextureConfig;
export type BaseCardDesignPreset = BaseCardTypes.CardDesignPreset;
export type SharedCardRarityConfig = SharedCardTypes.RarityConfig;
export type SharedCardTextureConfig = SharedCardTypes.TextureConfig;
export type SharedCardDesignPreset = SharedCardTypes.CardDesignPreset;

// Definir CardMetadata para card-utils.ts
export interface CardMetadata {
	[key: string]: number | string;
}
