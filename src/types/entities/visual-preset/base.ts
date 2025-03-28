import type { Prisma } from '@prisma/client';

/**
 * Tipo base para VisualPreset derivado del schema de Prisma
 */
export type VisualPresetBase = Prisma.VisualPresetGetPayload<{}>;

/**
 * Interfaz para crear un nuevo preset visual
 */
export interface VisualPresetCreateInput {
	name: string;
	description?: string;
	category?: string;
	isDefault?: boolean;
	isPublic?: boolean;
	version?: string;
	author?: string;
	tags?: string;
	metadata?: string;

	// Configuraciones base
	coreConfig?: string;
	designConfig?: string;
	animationConfig?: string;
	layerConfig?: string;
	backsideConfig?: string;
	effectsConfig?: string;
	performanceConfig?: string;

	// Configuraciones comunes
	colorConfig?: string;
	imageGridConfig?: string;
	layoutConfig?: string;
	explodeConfig?: string;
	previewConfig?: string;
	rarityConfig?: string;
	validationConfig?: string;

	// Estilo Magic Card
	magicCardBase?: string;

	// Configuraciones específicas por entidad
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
 * Interfaz para actualizar un preset visual existente
 */
export interface VisualPresetUpdateInput {
	id: string;
	name?: string;
	description?: string;
	category?: string;
	isDefault?: boolean;
	isPublic?: boolean;
	version?: string;
	author?: string;
	tags?: string;
	metadata?: string;

	// Configuraciones base
	coreConfig?: string;
	designConfig?: string;
	animationConfig?: string;
	layerConfig?: string;
	backsideConfig?: string;
	effectsConfig?: string;
	performanceConfig?: string;

	// Configuraciones comunes
	colorConfig?: string;
	imageGridConfig?: string;
	layoutConfig?: string;
	explodeConfig?: string;
	previewConfig?: string;
	rarityConfig?: string;
	validationConfig?: string;

	// Estilo Magic Card
	magicCardBase?: string;

	// Configuraciones específicas por entidad
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
