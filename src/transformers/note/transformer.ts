/**
 * @file Transformadores principales para la entidad Note
 * @module transformers/note/transformer
 */

import { TransformerError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Note, NoteExtended, NoteWithStats } from '@/types/entities/note/types';
import { extendNote, fromPrismaNote } from './serializers';

const logger = serverLogger.withContext('NoteTransformer');

/**
 * 🔄 Transforma un objeto a Note, validando su estructura
 * @param note Objeto a transformar
 * @returns Note validado y estructurado
 * @throws TransformerError si la validación falla
 */
export function transformNote(note: unknown): Note {
	try {
		if (!note) {
			throw new Error('El objeto Note es nulo o indefinido');
		}

		// Si la nota viene de Prisma, transformarla
		if ('tags' in (note as any) && 'title' in (note as any)) {
			return fromPrismaNote(note as any);
		}

		// Si es un objeto simple, extenderlo
		return extendNote(note as any);
	} catch (error) {
		logger.error('Error transformando nota:', { error });
		throw new TransformerError('Error al transformar nota', { cause: error });
	}
}

/**
 * 🔄 Transforma una lista de objetos a Notes
 * @param notes Array de objetos a transformar
 * @returns Array de Notes validados
 * @throws TransformerError si la validación falla para algún elemento
 */
export function transformNotes(notes: unknown[]): Note[] {
	try {
		if (!Array.isArray(notes)) {
			throw new Error('El parámetro no es un array');
		}

		return notes.map((note) => transformNote(note));
	} catch (error) {
		logger.error('Error transformando lista de notas:', { error });
		throw new TransformerError('Error al transformar lista de notas', { cause: error });
	}
}

/**
 * 🔄 Transforma un Note a su versión extendida con propiedades para UI
 * @param note Note base a extender
 * @returns Note extendido con propiedades adicionales
 */
export function transformNoteToExtended(note: Note): NoteExtended {
	try {
		const baseNote = transformNote(note);

		// Extender la nota con propiedades para UI
		return {
			...baseNote,
			isSelected: false,
			isHighlighted: false,
			isEditing: false,
			isExpanded: false,
			displayOrder: 0,
			// Propiedades calculadas para UI
			tagsArray: typeof baseNote.tags === 'string' ? JSON.parse(baseNote.tags || '[]') : baseNote.tags || [],
			statusDisplay: getStatusDisplay(baseNote.status),
			priorityLevel: getPriorityLevel(baseNote.priority),
		};
	} catch (error) {
		logger.error('Error transformando nota a versión extendida:', { error, noteId: (note as any)?.id });
		throw new TransformerError('Error al transformar nota a versión extendida', { cause: error });
	}
}

/**
 * 🔄 Transforma un Note a su versión con estadísticas
 * @param note Note base
 * @returns Note con estadísticas calculadas
 */
export function transformNoteToWithStats(note: Note): NoteWithStats {
	try {
		const baseNote = transformNote(note);

		// Calcular totales para las estadísticas
		const counts = baseNote._count || {
			images: 0,
			videos: 0,
			collections: 0,
			albums: 0,
			tags: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		};

		// Determinar la última actualización
		const lastUpdated = baseNote.updatedAt || new Date();

		// Calcular nivel de importancia basado en prioridad y relaciones
		const importanceLevel = calculateImportanceLevel(baseNote, counts);

		// Construir y devolver el objeto extendido
		return {
			...baseNote,
			lastUpdated,
			imageCount: counts.images,
			videoCount: counts.videos,
			albumCount: counts.albums,
			tagCount: counts.tags,
			characterCount: counts.characters,
			conceptCount: counts.concepts,
			importanceLevel,
			contentLength: baseNote.content ? baseNote.content.length : 0,
			relatedItemsCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
			distribution: [
				{ name: 'images', count: counts.images },
				{ name: 'videos', count: counts.videos },
				{ name: 'concepts', count: counts.concepts },
				{ name: 'characters', count: counts.characters },
			],
		};
	} catch (error) {
		logger.error('Error transformando nota a versión con estadísticas:', { error, noteId: (note as any)?.id });
		throw new TransformerError('Error al transformar nota a versión con estadísticas', { cause: error });
	}
}

/**
 * Calcula el nivel de importancia de una nota basado en prioridad y relaciones
 * @private
 */
function calculateImportanceLevel(note: Note, counts: Record<string, number>): number {
	try {
		// Base: prioridad (0-10) + contenido asociado
		const priorityFactor = note.priority || 0;
		const contentLengthFactor = note.content ? Math.min(note.content.length / 1000, 5) : 0;
		const relationsFactor = Object.values(counts).reduce((sum, count) => sum + count, 0) * 0.2;

		// Importancia general (máximo 20)
		return Math.min(Math.round(priorityFactor + contentLengthFactor + relationsFactor), 20);
	} catch (error) {
		logger.warn('Error calculando nivel de importancia, usando valor por defecto:', error);
		return note.priority || 0; // Valor por defecto es la prioridad
	}
}

/**
 * Obtiene la representación visual del estado
 * @private
 */
function getStatusDisplay(status: string): { label: string; color: string } {
	const statusMap: Record<string, { label: string; color: string }> = {
		active: { label: 'Activa', color: '#4CAF50' },
		completed: { label: 'Completada', color: '#2196F3' },
		archived: { label: 'Archivada', color: '#9E9E9E' },
		pending: { label: 'Pendiente', color: '#FFC107' },
		important: { label: 'Importante', color: '#F44336' },
	};

	return statusMap[status.toLowerCase()] || { label: status, color: '#9E9E9E' };
}

/**
 * Obtiene el nivel de prioridad
 * @private
 */
function getPriorityLevel(priority: number): { label: string; color: string } {
	if (priority >= 8) return { label: 'Crítica', color: '#F44336' };
	if (priority >= 6) return { label: 'Alta', color: '#FF9800' };
	if (priority >= 4) return { label: 'Media', color: '#2196F3' };
	if (priority >= 2) return { label: 'Baja', color: '#4CAF50' };
	return { label: 'Mínima', color: '#9E9E9E' };
}
