/**
 * 🌈 Tipos para el módulo de capas
 */

/**
 * 📝 Tipos compartidos para el sistema de capas
 * @module LayerTypes
 */

import type { CSSProperties } from 'react';
import type { CardOptions } from '../types/card-settings-types';
import type { ActionResponse, BaseLayerConfig } from '../types/central-types';
import type { DistortionEffectsSystem } from '../types/distortion-effects-types';

/**
 * 🔧 Configuración base para todas las capas
 */
export interface BaseLayerConfig {
	enabled: boolean;
	layerIndex: number;
	visibleOnHover?: boolean;
}

/**
 * 🎨 Props comunes para todas las capas
 */
export interface CommonLayerProps {
	isHovered: boolean;
	isExploded: boolean;
	mousePosition: { x: number; y: number };
	activeLayer: string | null;
	style: CSSProperties;
}

/**
 * 🎛️ Props para componentes de configuración
 */
export interface LayerSettingsProps<T extends BaseLayerConfig> {
	config: T;
	onConfigChange: (config: Partial<T>) => void;
}

/**
 * 🔌 Acciones del servidor para las capas
 */
export interface LayerServerActions<T extends BaseLayerConfig> {
	getConfig: (entityType: string, entityId?: string) => Promise<LayerConfigResponse<T>>;
	updateConfig: (entityType: string, config: T, entityId?: string) => Promise<LayerConfigResponse<T>>;
	deleteConfig: (entityType: string, entityId?: string) => Promise<LayerConfigResponse<unknown>>;
}

/**
 * 📊 Respuesta de configuración de capa
 */
export interface LayerConfigResponse<T> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

/**
 * 🎯 Implementación de una capa
 */
export interface LayerImplementation<T extends BaseLayerConfig = BaseLayerConfig> {
	type: string;
	name: string;
	description?: string;
	defaultConfig: T;
	render: React.ComponentType<CommonLayerProps & { config: T }>;
	settings?: React.ComponentType<LayerSettingsProps<T>>;
	serverActions?: LayerServerActions<T>;
	icon?: string;
}

/**
 * 🎨 Tipos de efectos visuales comunes
 */
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export type AnimationType = 'none' | 'pulse' | 'follow-mouse' | 'static';

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
 * 🎨 Tipos de presets
 */
export interface LayerPreset<T extends BaseLayerConfig> {
	id: string;
	name: string;
	description?: string;
	config: T;
	thumbnail?: string;
	tags?: string[];
}

/**
 * 🔄 Estado de animación
 */
export interface AnimationState {
	phase: number;
	speed: number;
	enabled: boolean;
	type: AnimationType;
}

/**
 * 🖱️ Estado del mouse
 */
export interface MouseState {
	position: { x: number; y: number };
	isHovered: boolean;
	isPressed: boolean;
}

/**
 * 🎯 Estado de la capa
 */
export interface LayerState<T extends BaseLayerConfig> {
	config: T;
	isVisible: boolean;
	isActive: boolean;
	animation: AnimationState;
	mouse: MouseState;
}

/**
 * 🔄 Transformaciones
 */
export interface LayerTransform {
	translate: { x: number; y: number; z: number };
	rotate: { x: number; y: number; z: number };
	scale: { x: number; y: number; z: number };
}

/**
 * 🎨 Contexto de renderizado
 */
export interface RenderContext {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	pixelRatio: number;
}

/**
 * 🔧 Utilidades de capa
 */
export interface LayerUtils {
	generateId: () => string;
	clamp: (value: number, min: number, max: number) => number;
	lerp: (start: number, end: number, t: number) => number;
	random: (min: number, max: number) => number;
	map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
}

/**
 * Funciones de servidor para una capa
 */
export interface LayerServerActions<T extends BaseLayerConfig = BaseLayerConfig> {
	getConfig: (entityType: string, entityId?: string) => Promise<ActionResponse>;
	updateConfig: (entityType: string, config: T, entityId?: string) => Promise<ActionResponse>;
	deleteConfig: (entityType: string, entityId?: string) => Promise<ActionResponse>;
}

/**
 * Propiedades comunes para todos los componentes de capa
 */
export interface CommonLayerProps {
	entityType: string;
	entityId?: string;
	isExploded?: boolean;
	isHovered?: boolean;
	activeLayer?: string | null;
}

/**
 * Función para transformar una capa en la vista explotada
 */
export type ExplodeLayerTransformFunction = (index: number) => React.CSSProperties;

/**
 * Propiedades para el panel de configuración de capas
 */
export interface LayersSettingsPanelProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
	entityType: string;
	entityId?: string;
	className?: string;
	showPresets?: boolean;
}

/**
 * Opciones de configuración global para capas
 */
export interface LayersGlobalOptions {
	renderStrategy: 'stacked' | 'composed' | 'dynamic';
	compositionMode: 'normal' | 'overlay' | 'screen' | 'multiply';
	enableHoverEffects: boolean;
	enableActiveLayerHighlight: boolean;
	explodeSpacing: number;
}

/**
 * Información de una capa para el selector
 */
export interface LayerInfo {
	id: string;
	name: string;
	description?: string;
	icon?: React.ReactNode;
	category?: string;
	isEnabled: boolean;
	layerIndex: number;
}

/**
 * Estado del sistema de capas
 */
export interface LayersSystemState {
	activeLayers: string[];
	explodedView: boolean;
	selectedLayer: string | null;
	globalOptions: LayersGlobalOptions;
	layerConfigs: Record<string, BaseLayerConfig>;
}

/**
 * Evento de cambio de capa
 */
export interface LayerChangeEvent {
	layerId: string;
	enabled: boolean;
	config: BaseLayerConfig;
}

/**
 * Resultado del hook useLayersSystem
 */
export interface LayersSystemResult {
	layersSystem: {
		isReady: boolean;
		getLayers: () => LayerInfo[];
		getLayerConfig: (layerId: string) => BaseLayerConfig | null;
		updateLayerConfig: (layerId: string, config: Partial<BaseLayerConfig>) => void;
		enableLayer: (layerId: string, enabled: boolean) => void;
		setActiveLayer: (layerId: string | null) => void;
		toggleExplodedView: () => void;
		isExploded: boolean;
		activeLayer: string | null;
		reset: () => void;
	};
}

/**
 * Configuración para una capa específica
 */
export interface LayerConfig {
	/**
	 * Indica si la capa está habilitada
	 */
	enabled: boolean;

	/**
	 * Índice de la capa que determina su posición de renderizado
	 */
	layerIndex: number;

	/**
	 * Propiedades adicionales específicas de cada tipo de capa
	 */
	[key: string]: unknown;
}

/**
 * Configuración para la capa de distorsión
 */
export interface DistortionConfig extends BaseLayerConfig, DistortionEffectsSystem {
	layerIndex: number;
	[key: string]: unknown;
}

/**
 * Configuración para la capa de filtros
 */
export interface FilterLayerConfig extends BaseLayerConfig {
	// Configuración básica de filtros
	visibleOnHover: boolean;
	opacity: number;
	intensity: number;

	// Configuración de efectos específicos
	glow?: {
		enabled: boolean;
		color: string;
		radius: number;
		intensity: number;
		animated?: boolean;
		animationSpeed?: number;
		visibleOnHover?: boolean;
	};

	shadow?: {
		enabled: boolean;
		color: string;
		blur: number;
		offsetX: number;
		offsetY: number;
		inset?: boolean;
		visibleOnHover?: boolean;
	};

	distortion?: {
		enabled: boolean;
		type: string;
		amount: number;
		speed: number;
		animated?: boolean;
		frequency?: number;
		visibleOnHover?: boolean;
	};

	[key: string]: unknown;
}
