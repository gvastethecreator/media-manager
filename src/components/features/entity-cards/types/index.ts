/**
 * Archivo centralizado para exportar todos los tipos relacionados con entity-cards
 * Esto facilita la importación y mantiene la consistencia en todo el sistema
 */

// Exportar tipos desde archivos específicos, evitando ambigüedades
export type { BaseCardProps } from './base-card-types';
export * from './card-layer-types';
export * from './card-settings-types';
export * from './central-types';
export * from './character-card-types';
export * from './unified-card-types';

// Exportar selectivamente de base-card-types para evitar ambigüedades
import * as BaseCardTypes from './base-card-types';

// Exportar selectivamente de shared-card-types
import * as SharedCardTypes from './shared-card-types';

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
export type { BaseLayerConfig, LayerComponentProps, LayerSettingsProps } from '../layers/layer-plugin-system';

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
