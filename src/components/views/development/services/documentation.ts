/**
 * @file Servicios de documentación
 * @description Compatible con Vite + React
 */

import { clientLogger } from '@/lib/logger/client-logger';

/**
 * Carga el contenido de un archivo markdown desde la carpeta docs
 */
export async function loadDocumentationFile(filename: string): Promise<string> {
	try {
		// En un entorno de servidor real, podríamos leer el sistema de archivos directamente
		// Usamos fetch para obtener el archivo desde la carpeta pública

		const response = await fetch(`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/docs/${filename}`, {
			cache: 'no-store',
		});

		if (!response.ok) {
			throw new Error(`No se pudo cargar ${filename}`);
		}

		return await response.text();
	} catch (error) {
		clientLogger.error(`Could not load the documentation file ${filename}:`, error);
		return `# Error al cargar ${filename}\n\nThe requested file could not be loaded.`;
	}
}

/**
 * Carga varios archivos de documentación a la vez
 */
export async function loadDocumentationFiles(filenames: string[]): Promise<Record<string, string>> {
	const result: Record<string, string> = {};

	await Promise.all(
		filenames.map(async (filename) => {
			try {
				result[filename] = await loadDocumentationFile(filename);
			} catch (error) {
				clientLogger.error(`Error al cargar ${filename}:`, error);
				result[filename] = `# Error al cargar ${filename}\n\nThe requested file could not be loaded.`;
			}
		})
	);

	return result;
}
