/**
 * @file Servicio de API para Folder
 * @module services/folder/folder-api.service
 * @description Operaciones CRUD para carpetas usando fetch API (cliente)
 */

import type { FolderComplete, FolderCreateInput, FolderUpdateInput, FolderWithStats } from '@/types/entities/folder';

/**
 * Obtiene todas las carpetas, opcionalmente filtrando por un ID de padre.
 * @param parentId - ID de la carpeta padre para obtener sus hijos.
 * @returns Una promesa que se resuelve con un array de carpetas completas.
 */
export async function getFolders(parentId?: string): Promise<FolderComplete[]> {
	const url = parentId ? `/api/folders?parentId=${parentId}` : '/api/folders';
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('No se pudieron obtener las carpetas.');
	}
	return response.json();
}

/**
 * Obtiene una única carpeta por su ID.
 * @param id - El ID de la carpeta.
 * @returns Una promesa que se resuelve con la carpeta completa o null si no se encuentra.
 */
export async function getFolder(id: string): Promise<FolderComplete | null> {
	const response = await fetch(`/api/folders/${id}`);
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error('No se pudo obtener la carpeta.');
	}
	return response.json();
}

/**
 * Crea una nueva carpeta.
 * @param data - Los datos para crear la nueva carpeta.
 * @returns Una promesa que se resuelve con la carpeta recién creada.
 */
export async function createFolder(data: FolderCreateInput): Promise<FolderComplete> {
	const response = await fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('No se pudo crear la carpeta.');
	}
	return response.json();
}

/**
 * Actualiza una carpeta existente.
 * @param id - El ID de la carpeta a actualizar.
 * @param data - Los datos para actualizar la carpeta.
 * @returns Una promesa que se resuelve con la carpeta actualizada.
 */
export async function updateFolder(id: string, data: FolderUpdateInput): Promise<FolderComplete> {
	const response = await fetch(`/api/folders/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('No se pudo actualizar la carpeta.');
	}
	return response.json();
}

/**
 * Elimina una carpeta.
 * @param id - El ID de la carpeta a eliminar.
 */
export async function deleteFolder(id: string): Promise<void> {
	const response = await fetch(`/api/folders/${id}`, {
		method: 'DELETE',
	});
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const errorMessage = errorData.error || 'No se pudo eliminar la carpeta.';
		throw new Error(errorMessage);
	}
}

/**
 * Obtiene todas las carpetas con estadísticas avanzadas, opcionalmente filtrando por un ID de padre.
 * @param parentId - ID de la carpeta padre para obtener sus hijos.
 * @returns Una promesa que se resuelve con un array de carpetas con estadísticas.
 */
export async function getFoldersWithStats(parentId?: string): Promise<FolderWithStats[]> {
	const url = parentId ? `/api/folders/stats?parentId=${parentId}` : '/api/folders/stats';
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('No se pudieron obtener las carpetas con estadísticas.');
	}
	return response.json();
}

// Nota: La lógica de indexación y eventos complejos se ha movido a un sistema de colas (Queue/Jobs)
// para desacoplar la lógica de negocio del acceso a datos y mejorar la escalabilidad.
// Este servicio se centra únicamente en operaciones CRUD.
