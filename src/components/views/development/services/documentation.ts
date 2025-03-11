'use server';

/**
 * Carga el contenido de un archivo markdown desde la carpeta docs
 */
export async function loadDocumentationFile(filename: string): Promise<string> {
	try {
		// En un entorno de servidor real, podríamos leer el sistema de archivos directamente
		// Para Next.js, usamos fetch para obtener el archivo desde la carpeta pública

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/docs/${filename}`, {
			cache: 'no-store',
		});

		if (!response.ok) {
			throw new Error(`No se pudo cargar ${filename}`);
		}

		return await response.text();
	} catch (error) {
		console.error(`Error al cargar el archivo de documentación ${filename}:`, error);
		return `# Error al cargar ${filename}\n\nNo se pudo cargar el archivo solicitado.`;
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
				console.error(`Error al cargar ${filename}:`, error);
				result[filename] = `# Error al cargar ${filename}\n\nNo se pudo cargar el archivo solicitado.`;
			}
		})
	);

	return result;
}
