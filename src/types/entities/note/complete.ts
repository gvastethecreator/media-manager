/**
 * @file Tipos completos para la entidad Note con campos JSON deserializados
 * @module types/entities/note/complete
 */

import type { NoteBase, NoteWithRelations } from './types';

/**
 * Interfaz para Note con campos JSON deserializados
 */
export interface NoteComplete extends Omit<NoteBase, 'tags'> {
	/**
	 * Tags deserializados como array
	 */
	tags: string[];
}

/**
 * Interfaz para Note con relaciones y campos JSON deserializados
 */
export interface NoteWithRelationsComplete extends Omit<NoteWithRelations, 'tags'> {
	/**
	 * Tags deserializados como array
	 */
	tags: string[];
}

/**
 * Tipo para transformación completa de entidades con relaciones
 */
export type NoteCompleteTransform<T extends NoteBase> = Omit<T, 'tags'> & {
	tags: string[];
};
