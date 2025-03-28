'use server';

/**
 * Función asíncrona para crear un objeto de error para carpetas
 * Esta es una función asíncrona placeholder para seguir las reglas de Next.js 15
 */
export async function createFolderError(message: string, cause?: unknown) {
	console.error('Error de carpeta:', message, cause);
	return { message, cause, name: 'FolderError' };
}
