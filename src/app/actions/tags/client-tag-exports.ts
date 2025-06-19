'use client';

/**
 * @file Exportaciones para el cliente de transformadores de tags
 * @module app/actions/tags/client-tag-exports
 * @description Este archivo exporta los transformadores desde el cliente para evitar problemas con 'use server'
 */

/**
 * Constantes y funciones que se exportan desde los transformadores de tag
 */
export {
	// Constantes
	DEFAULT_TAG_COLOR,
	DEFAULT_TAG_EMOJI,
	// Funciones de extensión
	extendTag,
	extendTags,
	// Transformadores principales
	fromPrismaTag,
	fromPrismaTags,
	// Funciones de mapeo
	mapCompleteToTag,
	mapTagToComplete,
	tagToDisplayObject,
	// Funciones de conversión
	toCreateTagData,
	toPrismaTag,
	toRelatedTag,
	toSearchFilters,
	toSearchOptions,
	toSearchResult,
	toUpdateTagData,
	// Validación
	validateTag,
} from '@/transformers/tag/v2';
