/**
 * @file Actions para la entidad Note - Migradas a API calls
 * @module app/actions/notes/note.actions
 * @description Funciones que llaman a las rutas API de notas
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';

const logger = clientLogger.withContext('NoteActions');
const API_BASE = '/api/notes';

/**
 * Obtiene todas las notas con estadísticas.
 */
export async function getNotes(): Promise<NoteWithStats[]> {
	try {
		logger.info('📝 Obteniendo notas via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getNotes', { error });
		throw error;
	}
}

/**
 * Obtiene una única nota por su ID.
 */
export async function getNote(id: string): Promise<NoteWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo nota ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getNote: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea una nueva nota.
 */
export async function createNote(data: NoteCreateInput): Promise<NoteWithStats> {
	try {
		logger.info('📝 Creando nota via API', { title: data.title });

		const response = await fetch(API_BASE, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API createNote', { error, data });
		throw error;
	}
}

/**
 * Actualiza una nota existente.
 */
export async function updateNote(id: string, data: NoteUpdateInput): Promise<NoteWithStats> {
	try {
		logger.info(`🔄 Actualizando nota ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API updateNote: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina una nota.
 */
export async function deleteNote(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando nota ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteNote: ${id}`, { error });
		throw error;
	}
}
