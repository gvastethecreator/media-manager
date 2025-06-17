/**
 * @file Conversores para la entidad Tag
 * @module transformers/tag/v2/converters
 * @description Funciones para convertir entre diferentes formatos de Tag
 */

import { Logger } from '@/lib/logger';
import type { Tag, TagComplete } from '@/types/entities/tag/types';

const logger = new Logger('TagConverters');

/**
 * Convierte cualquier objeto de tag a una versión TagComplete completa
 * @param tag Objeto tag a convertir
 * @returns Una versión TagComplete del objeto
 */
export function mapTagToComplete(tag: any): TagComplete {
	try {
		// Si ya es un TagComplete, retornarlo directamente
		if (Object.hasOwn(tag, '_count')) {
			return tag as TagComplete;
		}

		// Asegurarse de que tenga ID
		if (!tag.id) {
			throw new Error('Tag must have an ID');
		}

		// Crear una versión completa del tag
		const tagComplete: TagComplete = {
			id: tag.id,
			name: tag.name || 'Unnamed Tag',
			emoji: tag.emoji || '🏷️',
			color: tag.color || '#3b82f6',
			description: tag.description || '',
			shortcut: tag.shortcut || null,
			category: tag.category || 'general',
			featuredImage: tag.featuredImage || null,
			isFavorite: tag.isFavorite || false,
			createdAt: tag.createdAt || new Date(),
			updatedAt: tag.updatedAt || new Date(),

			// Relaciones
			images: tag.images || [],
			videos: tag.videos || [],
			albums: tag.albums || [],
			collections: tag.collections || [],
			characters: tag.characters || [],
			places: tag.places || [],
			worldItems: tag.worldItems || [],
			concepts: tag.concepts || [],
			prompts: tag.prompts || [],
			notes: tag.notes || [],
			wildcards: tag.wildcards || [],
			properties: tag.properties || [],
			groups: tag.groups || [],

			// Contadores
			_count: tag._count || {
				images: tag.images?.length || 0,
				videos: tag.videos?.length || 0,
				albums: tag.albums?.length || 0,
				collections: tag.collections?.length || 0,
				characters: tag.characters?.length || 0,
				places: tag.places?.length || 0,
				worldItems: tag.worldItems?.length || 0,
				concepts: tag.concepts?.length || 0,
				prompts: tag.prompts?.length || 0,
				notes: tag.notes?.length || 0,
				wildcards: tag.wildcards?.length || 0,
				properties: tag.properties?.length || 0,
				groups: tag.groups?.length || 0,
			},
		};

		return tagComplete;
	} catch (error) {
		logger.error('Error convirtiendo a TagComplete:', error);
		throw error;
	}
}

/**
 * Convierte un TagComplete a un Tag básico
 * @param tag TagComplete a convertir
 * @returns Un Tag básico
 */
export function mapCompleteToTag(tagComplete: TagComplete): Tag {
	try {
		// Extraer solo los campos básicos
		const tag: Tag = {
			id: tagComplete.id,
			name: tagComplete.name,
			emoji: tagComplete.emoji,
			color: tagComplete.color,
			description: tagComplete.description,
			shortcut: tagComplete.shortcut,
			category: tagComplete.category,
			featuredImage: tagComplete.featuredImage,
			isFavorite: tagComplete.isFavorite,
			createdAt: tagComplete.createdAt,
			updatedAt: tagComplete.updatedAt,
		};

		return tag;
	} catch (error) {
		logger.error('Error convirtiendo a Tag básico:', error);
		throw error;
	}
}

/**
 * Convierte un Tag a un objeto para mostrar en UI
 * @param tag Tag a convertir
 * @returns Un objeto con datos formateados para UI
 */
export function tagToDisplayObject(tag: Tag | TagComplete) {
	try {
		return {
			id: tag.id,
			name: tag.name,
			emoji: tag.emoji || '🏷️',
			color: tag.color || '#3b82f6',
			category: tag.category,
			shortcutDisplay: tag.shortcut ? `Ctrl+${tag.shortcut.toUpperCase()}` : '',
			description: tag.description || '',
			isFavorite: tag.isFavorite,
			hasShortcut: !!tag.shortcut,
			itemCount: '_count' in tag ? (tag._count.images || 0) + (tag._count.videos || 0) + (tag._count.albums || 0) : 0,
		};
	} catch (error) {
		logger.error('Error convirtiendo a objeto de visualización:', error);
		return {
			id: tag?.id || 'unknown',
			name: tag?.name || 'Unknown',
			emoji: '🏷️',
			color: '#3b82f6',
			category: 'general',
			shortcutDisplay: '',
			description: '',
			isFavorite: false,
			hasShortcut: false,
			itemCount: 0,
		};
	}
}
