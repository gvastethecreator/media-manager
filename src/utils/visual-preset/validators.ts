import { serverLogger } from '@/lib/logger/server-logger';
import { AnimationType, CardDesignType, CornerStyle, LayerType, PerformanceMode } from '@/types/entities/visual-preset';
import { z } from 'zod';

const validatorsLogger = serverLogger.withContext('VisualPreset:Validators');

// Esquema para validar etiquetas
export const visualPresetTagsSchema = z.object({
	items: z.array(z.string()),
});

// Esquema para validar config de colores
export const colorConfigSchema = z.object({
	primaryColor: z.string(),
	secondaryColor: z.string(),
	accentColor: z.string().optional(),
	backgroundColor: z.string().optional(),
	textColor: z.string().optional(),
	borderColor: z.string().optional(),
	highlightColor: z.string().optional(),
	shadowColor: z.string().optional(),
});

// Esquema para validar config de cuadrícula de imágenes
export const imageGridConfigSchema = z.object({
	layout: z.string(),
	gap: z.number(),
	columns: z.number().optional(),
	rows: z.number().optional(),
	aspectRatio: z.string(),
	style: z.string(),
});

// Esquema para validar config de diseño
export const layoutConfigSchema = z.object({
	designType: z.nativeEnum(CardDesignType),
	cornerStyle: z.nativeEnum(CornerStyle),
	cornerRadius: z.number(),
	elevation: z.number(),
	shadowStyle: z.string(),
	aspectRatio: z.string().optional(),
});

// Esquema para validar config del sistema de capas
export const layerSystemConfigSchema = z.object({
	layers: z.array(z.nativeEnum(LayerType)),
	layerOrder: z.record(z.nativeEnum(LayerType), z.number()),
	visibleLayers: z.array(z.nativeEnum(LayerType)),
});

// Esquema para validar config de efectos
export const effectsConfigSchema = z.object({
	enableGlow: z.boolean(),
	enableScanlines: z.boolean(),
	enableGrainEffect: z.boolean(),
	enableLightHalo: z.boolean(),
	enableAnimatedBorder: z.boolean(),
	enable3DEffect: z.boolean(),
	enableHolographicEffect: z.boolean(),
	enableGlitchEffect: z.boolean(),
	enableChromaticAberration: z.boolean(),
	enablePixelate: z.boolean(),
	maxRotation: z.number().optional(),
	hoverLiftHeight: z.number().optional(),
});

// Esquema para validar config de rendimiento
export const performanceConfigSchema = z.object({
	mode: z.nativeEnum(PerformanceMode),
	enableLazyLoading: z.boolean(),
	enablePrefetch: z.boolean(),
	enableSkeleton: z.boolean(),
	optimizeForMobile: z.boolean(),
	optimizeForTouch: z.boolean(),
});

// Esquema para validar config de estados de UI
export const uiStatesConfigSchema = z.object({
	enableHover: z.boolean(),
	enableActive: z.boolean(),
	enableFocus: z.boolean(),
	enableDisabled: z.boolean(),
	hoverAnimation: z.nativeEnum(AnimationType).optional(),
	activeAnimation: z.nativeEnum(AnimationType).optional(),
	focusAnimation: z.nativeEnum(AnimationType).optional(),
});

// Esquema para crear un preset visual
export const createVisualPresetSchema = z.object({
	name: z.string().min(1, 'El nombre es obligatorio'),
	description: z.string().optional(),
	category: z.string().default('general'),
	isDefault: z.boolean().default(false),
	isPublic: z.boolean().default(true),
	version: z.string().default('1.0.0'),
	author: z.string().optional(),
	tags: z.array(z.string()).optional().default([]),

	// Campos de configuración - Opcionales porque se serializan
	coreConfig: z.string().optional(),
	designConfig: z.string().optional(),
	animationConfig: z.string().optional(),
	layerConfig: z.string().optional(),
	backsideConfig: z.string().optional(),
	effectsConfig: z.string().optional(),
	performanceConfig: z.string().optional(),
	colorConfig: z.string().optional(),
	imageGridConfig: z.string().optional(),
	layoutConfig: z.string().optional(),
	explodeConfig: z.string().optional(),
	previewConfig: z.string().optional(),
	rarityConfig: z.string().optional(),
	validationConfig: z.string().optional(),
	magicCardBase: z.string().optional(),

	// Configuraciones específicas por entidad
	folderConfig: z.string().optional(),
	imageConfig: z.string().optional(),
	videoConfig: z.string().optional(),
	albumConfig: z.string().optional(),
	tagConfig: z.string().optional(),
	collectionConfig: z.string().optional(),
	characterConfig: z.string().optional(),
	placeConfig: z.string().optional(),
	worldItemConfig: z.string().optional(),
	conceptConfig: z.string().optional(),
	promptConfig: z.string().optional(),
	noteConfig: z.string().optional(),
});

// Esquema para actualizar un preset visual
export const updateVisualPresetSchema = z.object({
	id: z.string().min(1, 'El ID es obligatorio'),
	name: z.string().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	isDefault: z.boolean().optional(),
	isPublic: z.boolean().optional(),
	version: z.string().optional(),
	author: z.string().optional(),
	tags: z.array(z.string()).optional(),

	// Campos de configuración - Opcionales
	coreConfig: z.string().optional(),
	designConfig: z.string().optional(),
	animationConfig: z.string().optional(),
	layerConfig: z.string().optional(),
	backsideConfig: z.string().optional(),
	effectsConfig: z.string().optional(),
	performanceConfig: z.string().optional(),
	colorConfig: z.string().optional(),
	imageGridConfig: z.string().optional(),
	layoutConfig: z.string().optional(),
	explodeConfig: z.string().optional(),
	previewConfig: z.string().optional(),
	rarityConfig: z.string().optional(),
	validationConfig: z.string().optional(),
	magicCardBase: z.string().optional(),

	// Configuraciones específicas por entidad
	folderConfig: z.string().optional(),
	imageConfig: z.string().optional(),
	videoConfig: z.string().optional(),
	albumConfig: z.string().optional(),
	tagConfig: z.string().optional(),
	collectionConfig: z.string().optional(),
	characterConfig: z.string().optional(),
	placeConfig: z.string().optional(),
	worldItemConfig: z.string().optional(),
	conceptConfig: z.string().optional(),
	promptConfig: z.string().optional(),
	noteConfig: z.string().optional(),
});
