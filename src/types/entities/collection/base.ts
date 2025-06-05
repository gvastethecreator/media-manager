/**
 * @file Tipos base para la entidad Collection derivados directamente de Prisma
 * @module types/entities/collection/base
 */

import type { Collection as PrismaCollection } from '@prisma/client';
import type { CollectionEdition, CollectionFilter } from './types';

/**
 * Tipo base para Collection, extendido directamente del tipo Prisma
 */
export type CollectionBase = PrismaCollection;

/**
 * Resumen básico de una colección para listados
 */
export interface CollectionSummary {
	id: string;
	name: string;
	emoji: string;
	color: string;
	imageCount: number;
	category?: string;
}

/**
 * Representación completa de la colección con campos JSON deserializados
 */
export interface CollectionComplete extends Omit<PrismaCollection, 'filters' | 'sortBy' | 'editions'> {
	/**
	 * Filtros deserializados como un array de objetos
	 */
	filters: CollectionFilter[];

	/**
	 * Criterio de ordenación deserializado como objeto
	 */
	sortBy: any;

	/**
	 * Ediciones deserializadas como array de objetos
	 */
	editions: CollectionEdition[];
}
