/**
 * @file Generador de IDs para carpetas basado en nombres
 * @module lib/utils/folder-id-generator
 * @description Utilidades para generar IDs únicos basados en nombres de carpeta
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';

/**
 * Normaliza un nombre de carpeta para usarlo como ID
 * @param name - Nombre de la carpeta
 * @returns Nombre normalizado
 */
export function normalizeFolderName(name: string): string {
	// Convertir a minúsculas
	let normalized = name.toLowerCase();

	// Reemplazar caracteres especiales y acentos
	normalized = normalized
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remover acentos
		.replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
		.replace(/\s+/g, '-') // Espacios a guiones
		.replace(/-+/g, '-') // Múltiples guiones a uno solo
		.replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final

	// Asegurar que no esté vacío
	if (!normalized) {
		normalized = 'carpeta';
	}

	return normalized;
}

/**
 * Verifica si un ID de carpeta ya existe en la base de datos
 * @param id - ID a verificar
 * @returns true si existe, false si no
 */
export async function folderIdExists(id: string): Promise<boolean> {
	try {
		const result = await db.select({ id: folders.id }).from(folders).where(eq(folders.id, id)).limit(1);

		return result.length > 0;
	} catch (error) {
		console.error('Error verificando existencia de ID de carpeta:', error);
		return false;
	}
}

/**
 * Genera un ID único basado en el nombre de la carpeta
 * @param name - Nombre de la carpeta
 * @param maxAttempts - Número máximo de intentos (default: 100)
 * @returns ID único generado
 */
export async function generateFolderIdFromName(name: string, maxAttempts = 100): Promise<string> {
	const baseName = normalizeFolderName(name);

	// Intentar primero sin sufijo
	let candidateId = baseName;
	let exists = await folderIdExists(candidateId);

	if (!exists) {
		return candidateId;
	}

	// Si existe, probar con sufijos numéricos
	for (let i = 2; i <= maxAttempts; i++) {
		candidateId = `${baseName}-${i}`;
		exists = await folderIdExists(candidateId);

		if (!exists) {
			return candidateId;
		}
	}

	// Si llegamos aquí, fallback a UUID
	console.warn(`No se pudo generar ID único para '${name}' después de ${maxAttempts} intentos. Usando UUID.`);
	return crypto.randomUUID();
}

/**
 * Valida si un ID tiene formato válido (UUID o nombre normalizado)
 * @param id - ID a validar
 * @returns true si es válido
 */
export function isValidFolderId(id: string): boolean {
	// Verificar si es UUID
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (uuidRegex.test(id)) {
		return true;
	}

	// Verificar si es nombre normalizado válido
	const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*(-\d+)?$/;
	return nameRegex.test(id) && id.length <= 100;
}

/**
 * Obtiene sugerencias de nombres alternativos basados en un nombre dado
 * @param name - Nombre base
 * @param count - Número de sugerencias (default: 5)
 * @returns Array de nombres sugeridos
 */
export function getFolderNameSuggestions(name: string, count = 5): string[] {
	const baseName = normalizeFolderName(name);
	const suggestions: string[] = [];

	for (let i = 2; i <= count + 1; i++) {
		suggestions.push(`${baseName}-${i}`);
	}

	return suggestions;
}
