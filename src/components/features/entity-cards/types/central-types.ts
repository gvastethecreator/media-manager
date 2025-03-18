/**
 * Archivo central para tipos compartidos en todo el sistema de entity-cards
 * Esto ayuda a evitar inconsistencias y duplicación de tipos
 */

// Tipos de entidad soportados
export type EntityType =
	| 'folder'
	| 'image'
	| 'video'
	| 'album'
	| 'tag'
	| 'collection'
	| 'character'
	| 'place'
	| 'worldItem'
	| 'concept'
	| 'prompt'
	| 'note';

// Interfaz para presets visuales (configuraciones guardadas)
export interface VisualPreset {
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

// Tipos para respuestas de acciones del servidor
export interface ActionResponse<T = any> {
	success: boolean;
	message: string;
	data?: T;
	error?: any;
}

// Tipos para opciones de capas
export interface BaseLayerConfig {
	enabled: boolean;
	layerIndex: number;
	[key: string]: any;
}

// Tipos para configuraciones de efectos
export interface EffectConfig {
	enabled: boolean;
	intensity: number;
	visibleOnHover?: boolean;
	[key: string]: any;
}

// Tipos para configuraciones de animación
export interface AnimationConfig {
	enabled: boolean;
	duration: number;
	easing: string;
	delay?: number;
	[key: string]: any;
}

// Tipos para configuraciones de diseño
export interface DesignConfig {
	preset?: string;
	cornerStyle?: string;
	cornerRadius?: number | string;
	borderStyle?: string;
	borderWidth?: number | string;
	borderColor?: string;
	backgroundColor?: string;
	textColor?: string;
	accentColor?: string;
	[key: string]: any;
}

// Tipos para configuraciones de rendimiento
export interface PerformanceConfig {
	enableHardwareAcceleration?: boolean;
	useRAF?: boolean;
	batchUpdates?: boolean;
	throttleMs?: number;
	[key: string]: any;
}

// Tipos para configuraciones de colores
export interface ColorConfig {
	primary?: string;
	secondary?: string;
	accent?: string;
	background?: string;
	foreground?: string;
	border?: string;
	[key: string]: any;
}

// Exportar otras interfaces según sea necesario
