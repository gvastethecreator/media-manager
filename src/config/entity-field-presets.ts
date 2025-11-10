/**
 * @file Configuración de presets de campos por tipo de entidad
 * @module config/entity-field-presets
 * @description Define conjuntos de campos predefinidos (presets) para diferentes
 *              niveles de detalle al crear entidades abstractas
 */

import type { EntityType } from '@/types/entities/entity.types';

/**
 * Definición de un campo de formulario
 */
export interface FieldConfig {
	/** Nombre del campo (debe coincidir con la propiedad del tipo) */
	name: string;
	/** Etiqueta visible para el usuario */
	label: string;
	/** Tipo de campo para renderización */
	type: 'text' | 'textarea' | 'number' | 'select' | 'color' | 'emoji' | 'checkbox' | 'date';
	/** Placeholder opcional */
	placeholder?: string;
	/** Opciones para campos select */
	options?: Array<{ value: string; label: string }>;
	/** Valor por defecto */
	defaultValue?: any;
	/** Si es requerido */
	required?: boolean;
	/** Descripción/ayuda del campo */
	description?: string;
	/** Validación mínima (para texto/números) */
	min?: number;
	/** Validación máxima (para texto/números) */
	max?: number;
}

/**
 * Definición de un preset
 */
export interface FieldPreset {
	/** ID único del preset */
	id: string;
	/** Nombre visible del preset */
	name: string;
	/** Descripción del preset */
	description: string;
	/** Icono representativo (emoji) */
	icon: string;
	/** Campos incluidos en este preset */
	fields: string[];
	/** Si es el preset por defecto */
	isDefault?: boolean;
}

/**
 * Configuración completa de presets para un tipo de entidad
 */
export interface EntityPresetConfig {
	/** Tipo de entidad */
	entityType: EntityType;
	/** Todos los campos disponibles */
	availableFields: FieldConfig[];
	/** Presets predefinidos */
	presets: FieldPreset[];
}

/**
 * 🧑 PRESETS PARA CHARACTERS
 */
export const CHARACTER_PRESETS: EntityPresetConfig = {
	entityType: 'character',
	availableFields: [
		// Campos básicos (siempre name es requerido)
		{ name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre del personaje' },
		{ name: 'emoji', label: 'Emoji', type: 'emoji', defaultValue: '👤' },
		{ name: 'color', label: 'Color', type: 'color', defaultValue: '#3b82f6' },
		{
			name: 'description',
			label: 'Descripción',
			type: 'textarea',
			placeholder: 'Breve descripción del personaje',
			max: 200,
		},

		// Campos de identidad
		{ name: 'age', label: 'Edad', type: 'text', placeholder: 'Ej: 25, Adulto joven' },
		{
			name: 'gender',
			label: 'Género',
			type: 'select',
			options: [
				{ value: 'male', label: 'Masculino' },
				{ value: 'female', label: 'Femenino' },
				{ value: 'non-binary', label: 'No binario' },
				{ value: 'other', label: 'Otro' },
			],
		},
		{ name: 'species', label: 'Especie/Raza', type: 'text', placeholder: 'Ej: Humano, Elfo, Orco' },
		{ name: 'occupation', label: 'Ocupación', type: 'text', placeholder: 'Ej: Guerrero, Mago, Comerciante' },

		// Campos de personalidad
		{
			name: 'personality',
			label: 'Personalidad',
			type: 'textarea',
			placeholder: 'Rasgos de personalidad principales',
			max: 500,
		},
		{
			name: 'background',
			label: 'Historia/Origen',
			type: 'textarea',
			placeholder: 'Historia de fondo del personaje',
			max: 1000,
		},
		{
			name: 'relationships',
			label: 'Relaciones',
			type: 'textarea',
			placeholder: 'Relaciones con otros personajes',
			max: 500,
		},

		// Campos RPG
		{
			name: 'class',
			label: 'Clase',
			type: 'select',
			options: [
				{ value: 'warrior', label: 'Guerrero' },
				{ value: 'mage', label: 'Mago' },
				{ value: 'rogue', label: 'Pícaro' },
				{ value: 'cleric', label: 'Clérigo' },
				{ value: 'ranger', label: 'Montaraz' },
				{ value: 'paladin', label: 'Paladín' },
				{ value: 'druid', label: 'Druida' },
				{ value: 'bard', label: 'Bardo' },
			],
		},
		{ name: 'level', label: 'Nivel', type: 'number', min: 1, max: 100 },
		{
			name: 'alignment',
			label: 'Alineamiento',
			type: 'select',
			options: [
				{ value: 'lawful-good', label: 'Legal Bueno' },
				{ value: 'neutral-good', label: 'Neutral Bueno' },
				{ value: 'chaotic-good', label: 'Caótico Bueno' },
				{ value: 'lawful-neutral', label: 'Legal Neutral' },
				{ value: 'true-neutral', label: 'Neutral Puro' },
				{ value: 'chaotic-neutral', label: 'Caótico Neutral' },
				{ value: 'lawful-evil', label: 'Legal Malvado' },
				{ value: 'neutral-evil', label: 'Neutral Malvado' },
				{ value: 'chaotic-evil', label: 'Caótico Malvado' },
			],
		},
		{ name: 'skills', label: 'Habilidades', type: 'textarea', placeholder: 'Lista de habilidades', max: 500 },
		{ name: 'equipment', label: 'Equipamiento', type: 'textarea', placeholder: 'Objetos y equipo', max: 500 },

		// Campos adicionales
		{ name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Notas adicionales', max: 1000 },
		{ name: 'isFavorite', label: 'Marcar como favorito', type: 'checkbox', defaultValue: false },
	],
	presets: [
		{
			id: 'minimal',
			name: 'Mínimo',
			description: 'Solo nombre y emoji - perfecto para empezar rápido',
			icon: '⚡',
			fields: ['name', 'emoji'],
			isDefault: true,
		},
		{
			id: 'basic',
			name: 'Básico',
			description: 'Información esencial del personaje',
			icon: '📝',
			fields: ['name', 'emoji', 'color', 'description', 'age', 'gender', 'occupation'],
		},
		{
			id: 'standard',
			name: 'Estándar',
			description: 'Personaje completo con personalidad e historia',
			icon: '👤',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'age',
				'gender',
				'species',
				'occupation',
				'personality',
				'background',
				'relationships',
				'isFavorite',
			],
		},
		{
			id: 'rpg',
			name: 'RPG',
			description: 'Personaje de rol con stats y habilidades',
			icon: '🎲',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'class',
				'level',
				'species',
				'alignment',
				'background',
				'skills',
				'equipment',
				'notes',
				'isFavorite',
			],
		},
		{
			id: 'complete',
			name: 'Completo',
			description: 'Todos los campos disponibles',
			icon: '📋',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'age',
				'gender',
				'species',
				'occupation',
				'personality',
				'background',
				'relationships',
				'class',
				'level',
				'alignment',
				'skills',
				'equipment',
				'notes',
				'isFavorite',
			],
		},
	],
};

/**
 * 📍 PRESETS PARA PLACES
 */
export const PLACE_PRESETS: EntityPresetConfig = {
	entityType: 'place',
	availableFields: [
		{ name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre del lugar' },
		{ name: 'emoji', label: 'Emoji', type: 'emoji', defaultValue: '📍' },
		{ name: 'color', label: 'Color', type: 'color', defaultValue: '#ef4444' },
		{ name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción del lugar', max: 200 },
		{
			name: 'type',
			label: 'Tipo',
			type: 'select',
			options: [
				{ value: 'city', label: 'Ciudad' },
				{ value: 'town', label: 'Pueblo' },
				{ value: 'dungeon', label: 'Mazmorra' },
				{ value: 'forest', label: 'Bosque' },
				{ value: 'mountain', label: 'Montaña' },
				{ value: 'cave', label: 'Cueva' },
				{ value: 'building', label: 'Edificio' },
				{ value: 'landmark', label: 'Punto de Interés' },
			],
		},
		{ name: 'location', label: 'Ubicación', type: 'text', placeholder: 'Ej: Norte del reino, En las montañas' },
		{ name: 'climate', label: 'Clima', type: 'text', placeholder: 'Ej: Templado, Frío, Tropical' },
		{
			name: 'population',
			label: 'Población',
			type: 'text',
			placeholder: 'Ej: 10,000 habitantes, Deshabitado',
		},
		{ name: 'history', label: 'Historia', type: 'textarea', placeholder: 'Historia del lugar', max: 1000 },
		{
			name: 'pointsOfInterest',
			label: 'Puntos de Interés',
			type: 'textarea',
			placeholder: 'Lugares importantes dentro',
			max: 500,
		},
		{ name: 'dangers', label: 'Peligros', type: 'textarea', placeholder: 'Peligros o amenazas', max: 500 },
		{ name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Notas adicionales', max: 1000 },
		{ name: 'isFavorite', label: 'Marcar como favorito', type: 'checkbox', defaultValue: false },
	],
	presets: [
		{
			id: 'minimal',
			name: 'Mínimo',
			description: 'Solo nombre y emoji',
			icon: '⚡',
			fields: ['name', 'emoji'],
			isDefault: true,
		},
		{
			id: 'basic',
			name: 'Básico',
			description: 'Información básica del lugar',
			icon: '📝',
			fields: ['name', 'emoji', 'color', 'description', 'type', 'location'],
		},
		{
			id: 'standard',
			name: 'Estándar',
			description: 'Lugar completo con detalles',
			icon: '📍',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'type',
				'location',
				'climate',
				'population',
				'history',
				'pointsOfInterest',
				'isFavorite',
			],
		},
		{
			id: 'complete',
			name: 'Completo',
			description: 'Todos los campos disponibles',
			icon: '📋',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'type',
				'location',
				'climate',
				'population',
				'history',
				'pointsOfInterest',
				'dangers',
				'notes',
				'isFavorite',
			],
		},
	],
};

/**
 * 💡 PRESETS PARA CONCEPTS
 */
export const CONCEPT_PRESETS: EntityPresetConfig = {
	entityType: 'concept',
	availableFields: [
		{ name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre del concepto' },
		{ name: 'emoji', label: 'Emoji', type: 'emoji', defaultValue: '💡' },
		{ name: 'color', label: 'Color', type: 'color', defaultValue: '#8b5cf6' },
		{
			name: 'description',
			label: 'Descripción',
			type: 'textarea',
			placeholder: 'Descripción del concepto',
			max: 200,
		},
		{
			name: 'category',
			label: 'Categoría',
			type: 'select',
			options: [
				{ value: 'magic', label: 'Magia' },
				{ value: 'technology', label: 'Tecnología' },
				{ value: 'philosophy', label: 'Filosofía' },
				{ value: 'science', label: 'Ciencia' },
				{ value: 'art', label: 'Arte' },
				{ value: 'culture', label: 'Cultura' },
			],
		},
		{ name: 'definition', label: 'Definición', type: 'textarea', placeholder: 'Definición detallada', max: 500 },
		{ name: 'examples', label: 'Ejemplos', type: 'textarea', placeholder: 'Ejemplos de uso', max: 500 },
		{
			name: 'relatedConcepts',
			label: 'Conceptos Relacionados',
			type: 'textarea',
			placeholder: 'Otros conceptos relacionados',
			max: 300,
		},
		{ name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Notas adicionales', max: 1000 },
		{ name: 'isFavorite', label: 'Marcar como favorito', type: 'checkbox', defaultValue: false },
	],
	presets: [
		{
			id: 'minimal',
			name: 'Mínimo',
			description: 'Solo nombre y emoji',
			icon: '⚡',
			fields: ['name', 'emoji'],
			isDefault: true,
		},
		{
			id: 'basic',
			name: 'Básico',
			description: 'Concepto básico',
			icon: '📝',
			fields: ['name', 'emoji', 'color', 'description', 'category'],
		},
		{
			id: 'standard',
			name: 'Estándar',
			description: 'Concepto con definición y ejemplos',
			icon: '💡',
			fields: ['name', 'emoji', 'color', 'description', 'category', 'definition', 'examples', 'isFavorite'],
		},
		{
			id: 'complete',
			name: 'Completo',
			description: 'Todos los campos disponibles',
			icon: '📋',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'category',
				'definition',
				'examples',
				'relatedConcepts',
				'notes',
				'isFavorite',
			],
		},
	],
};

/**
 * 🌍 PRESETS PARA WORLD ITEMS
 */
export const WORLD_ITEM_PRESETS: EntityPresetConfig = {
	entityType: 'world-item',
	availableFields: [
		{ name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre del elemento del mundo' },
		{ name: 'emoji', label: 'Emoji', type: 'emoji', defaultValue: '🌍' },
		{ name: 'color', label: 'Color', type: 'color', defaultValue: '#10b981' },
		{
			name: 'description',
			label: 'Descripción',
			type: 'textarea',
			placeholder: 'Descripción del elemento',
			max: 200,
		},
		{
			name: 'type',
			label: 'Tipo',
			type: 'select',
			options: [
				{ value: 'item', label: 'Objeto' },
				{ value: 'artifact', label: 'Artefacto' },
				{ value: 'resource', label: 'Recurso' },
				{ value: 'currency', label: 'Moneda' },
				{ value: 'document', label: 'Documento' },
			],
		},
		{ name: 'properties', label: 'Propiedades', type: 'textarea', placeholder: 'Propiedades del objeto', max: 500 },
		{ name: 'value', label: 'Valor', type: 'text', placeholder: 'Ej: 100 piezas de oro' },
		{ name: 'rarity', label: 'Rareza', type: 'text', placeholder: 'Ej: Común, Raro, Legendario' },
		{ name: 'origin', label: 'Origen', type: 'textarea', placeholder: 'Historia del origen', max: 500 },
		{ name: 'effects', label: 'Efectos', type: 'textarea', placeholder: 'Efectos o poderes', max: 500 },
		{ name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Notas adicionales', max: 1000 },
		{ name: 'isFavorite', label: 'Marcar como favorito', type: 'checkbox', defaultValue: false },
	],
	presets: [
		{
			id: 'minimal',
			name: 'Mínimo',
			description: 'Solo nombre y emoji',
			icon: '⚡',
			fields: ['name', 'emoji'],
			isDefault: true,
		},
		{
			id: 'basic',
			name: 'Básico',
			description: 'Información básica del objeto',
			icon: '📝',
			fields: ['name', 'emoji', 'color', 'description', 'type', 'value', 'rarity'],
		},
		{
			id: 'standard',
			name: 'Estándar',
			description: 'Objeto con propiedades y efectos',
			icon: '🌍',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'type',
				'properties',
				'value',
				'rarity',
				'effects',
				'isFavorite',
			],
		},
		{
			id: 'complete',
			name: 'Completo',
			description: 'Todos los campos disponibles',
			icon: '📋',
			fields: [
				'name',
				'emoji',
				'color',
				'description',
				'type',
				'properties',
				'value',
				'rarity',
				'origin',
				'effects',
				'notes',
				'isFavorite',
			],
		},
	],
};

/**
 * 🏷️ PRESETS PARA TAGS (simplificado)
 */
export const TAG_PRESETS: EntityPresetConfig = {
	entityType: 'tag',
	availableFields: [
		{ name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre de la etiqueta' },
		{ name: 'emoji', label: 'Emoji', type: 'emoji', defaultValue: '🏷️' },
		{ name: 'color', label: 'Color', type: 'color', defaultValue: '#06b6d4' },
		{ name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción de la etiqueta', max: 200 },
		{ name: 'isFavorite', label: 'Marcar como favorito', type: 'checkbox', defaultValue: false },
	],
	presets: [
		{
			id: 'minimal',
			name: 'Mínimo',
			description: 'Solo nombre',
			icon: '⚡',
			fields: ['name'],
			isDefault: true,
		},
		{
			id: 'basic',
			name: 'Básico',
			description: 'Etiqueta con apariencia',
			icon: '📝',
			fields: ['name', 'emoji', 'color'],
		},
		{
			id: 'complete',
			name: 'Completo',
			description: 'Etiqueta completa',
			icon: '📋',
			fields: ['name', 'emoji', 'color', 'description', 'isFavorite'],
		},
	],
};

/**
 * 📚 Mapa de presets por tipo de entidad
 */
export const ENTITY_PRESETS_MAP: Record<string, EntityPresetConfig> = {
	character: CHARACTER_PRESETS,
	place: PLACE_PRESETS,
	concept: CONCEPT_PRESETS,
	'world-item': WORLD_ITEM_PRESETS,
	tag: TAG_PRESETS,
};

/**
 * Obtener configuración de presets para un tipo de entidad
 */
export function getEntityPresets(entityType: string): EntityPresetConfig | null {
	return ENTITY_PRESETS_MAP[entityType] || null;
}

/**
 * Obtener preset por defecto para un tipo de entidad
 */
export function getDefaultPreset(entityType: string): FieldPreset | null {
	const config = getEntityPresets(entityType);
	return config?.presets.find((p) => p.isDefault) || config?.presets[0] || null;
}

/**
 * Obtener campos de un preset específico
 */
export function getPresetFields(entityType: string, presetId: string): FieldConfig[] {
	const config = getEntityPresets(entityType);
	if (!config) {
		return [];
	}

	const preset = config.presets.find((p) => p.id === presetId);
	if (!preset) {
		return [];
	}

	return preset.fields
		.map((fieldName) => config.availableFields.find((f) => f.name === fieldName))
		.filter((f): f is FieldConfig => f !== undefined);
}
