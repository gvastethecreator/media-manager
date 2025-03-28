/**
 * @file Este archivo define los tipos básicos para el sistema de capas
 * @module LayerTypes
 */

import type { ComponentType, ReactNode } from 'react';
import type { BaseLayerProps } from '../../types/base-card-types';
import type { BaseLayerConfig, BaseLayerResponse } from './layer-config-base';

/**
 * Propiedades base para todas las capas
 */
export interface CommonLayerProps {
	isExploded?: boolean;
	isHovered?: boolean;
	mousePosition?: { x: number; y: number };
	children?: ReactNode;
	entityType?: string;
	entityId?: string;
	isActive?: boolean;
	processedConfig: BaseLayerConfig;
	style: React.CSSProperties;
	isVisible: boolean;
}

/**
 * 🎨 Preset para una capa específica
 */
export interface LayerPreset<T = Record<string, unknown>> {
	name: string;
	description?: string;
	config: T;
}

/**
 * 🎛️ Props para componentes de configuración
 */
export interface LayerSettingsProps<T extends BaseLayerConfig> {
	config: T;
	onConfigChange: (config: Partial<T>) => void;
	entityType?: string;
	entityId?: string;
}

/**
 * 📃 Respuesta de configuración de capa
 */
export interface LayerConfigResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * 🔌 Acciones del servidor para las capas
 */
export interface LayerServerActions<T extends BaseLayerConfig = BaseLayerConfig> {
	getConfig: (entityType: string, entityId?: string) => Promise<BaseLayerResponse<T>>;
	updateConfig: (entityType: string, config: T, entityId?: string) => Promise<BaseLayerResponse>;
	deleteConfig: (entityType: string, entityId?: string) => Promise<BaseLayerResponse>;
}

/**
 * 🎯 Implementación de una capa
 */
export interface LayerImplementation<T extends BaseLayerConfig = BaseLayerConfig> {
	type: string;
	name: string;
	description?: string;
	category?: string;
	defaultConfig: T;
	render: ComponentType<CommonLayerProps & { config: T }>;
	settings?: ComponentType<LayerSettingsProps<T>>;
	serverActions?: LayerServerActions<T>;
	icon: ComponentType<any> | string;
	compatibleEntityTypes?: string[];
	presets?: LayerPreset<T>[];
}

/**
 * 🎨 Tipos de efectos visuales comunes
 */
export type BlendMode =
	| 'normal'
	| 'multiply'
	| 'screen'
	| 'overlay'
	| 'darken'
	| 'lighten'
	| 'color-dodge'
	| 'color-burn'
	| 'hard-light'
	| 'soft-light'
	| 'difference'
	| 'exclusion';

/**
 * 🎨 Tipos de filtros visuales
 */
export interface FilterStyles {
	brightness?: number;
	contrast?: number;
	saturation?: number;
	hueRotate?: number;
	blur?: number;
	opacity?: number;
	blendMode?: BlendMode;
}

/**
 * ✨ Tipos de efectos de brillo
 */
export interface GlowStyles {
	color: string;
	intensity: number;
	spread: number;
	followMouse: boolean;
	animationType: AnimationType;
	animationSpeed: number;
}

/**
 * 🌫️ Tipos de efectos de ruido
 */
export interface NoiseStyles {
	opacity: number;
	scale: number;
	seed: number;
	blendMode: BlendMode;
	animated: boolean;
	animationSpeed: number;
}

/**
 * 🔲 Tipos de patrones
 */
export interface PatternStyles {
	type: 'dots' | 'lines' | 'grid' | 'waves' | 'custom';
	color: string;
	opacity: number;
	scale: number;
	rotation: number;
	blendMode: BlendMode;
	customPattern?: string;
}

/**
 * 🎚️ Opciones para la configuración de una capa
 */
export interface LayerEditorOptions {
	layerType: string;
	entityType: string;
	entityId?: string;
	initialConfig?: Record<string, unknown>;
	onConfigChange: (config: Record<string, unknown>) => void;
	onCancel?: () => void;
}

/**
 * 📊 Estado de una capa
 */
export interface LayerState<T extends BaseLayerConfig = BaseLayerConfig> {
	type: string;
	enabled: boolean;
	component: ComponentType<BaseLayerProps<T>>;
	config: T;
}

/**
 * 🧩 Contexto para el sistema de capas
 */
export interface LayerPluginContext {
	layers: LayerImplementation[];
	registerLayer: (layer: LayerImplementation) => void;
	getLayer: (type: string) => LayerImplementation | undefined;
	getLayers: () => LayerImplementation[];
	hasLayer: (type: string) => boolean;
}

/**
 * 🔄 Props para cambiar entre capas
 */
export interface LayerSwitcherProps {
	currentType: string;
	onTypeChange: (type: string) => void;
	availableLayers?: LayerImplementation[];
}

/**
 * 🖼️ Estructura de datos para configuración de capas de una tarjeta
 */
export interface CardLayersConfig {
	[layerType: string]: Record<string, unknown>;
}

/**
 * 🛠️ Props para renderizar una capa
 */
export interface LayerRenderProps<T extends BaseLayerConfig = BaseLayerConfig> {
	layer: LayerImplementation<T>;
	config: T;
	isExploded?: boolean;
	isHovered?: boolean;
	mousePosition?: { x: number; y: number };
	children: ReactNode;
	isActive?: boolean;
	entityType?: string;
	entityId?: string;
}

/**
 * 🖱️ Estado del mouse para interacciones
 */
export interface MouseState {
	position: { x: number; y: number };
	isHovered: boolean;
	isPressed: boolean;
}

/**
 * Estructura de datos para la configuración del sistema de capas
 */
export interface LayerSystemConfig {
	order: string[];
	explodeView: boolean;
	explodeDistance: number;
	layerBlending: string;
	layerSpacing: number;
}

/**
 * 🧠 Estado del sistema de capas
 */
export interface LayersState {
	activeLayerIndex: number;
	explodeView: boolean;
	config: LayerSystemConfig;
	updateConfig: (config: Partial<LayerSystemConfig>) => void;
	setActiveLayerIndex: (index: number) => void;
	toggleExplodeView: () => void;
	reorderLayers: (order: string[]) => void;
}

/**
 * 🎨 Tipos de animación
 */
export type AnimationType = 'none' | 'pulse' | 'breathe' | 'bounce' | 'float' | 'custom';

/**
 * Props comunes para los formularios de configuración de capas
 */
export interface CommonLayerFormProps<T extends BaseLayerConfig> {
	config: T;
	onUpdate: (config: T) => void;
	onDelete?: () => void;
}
