'use client';

import { getTagImages } from '@/app/actions/tags/tag.actions';
import { useFileManager } from '@/store/files/file-manager.store';
import type { FileItem } from '@/types/file-item';
import { useCallback } from 'react';

/**
 * 🏷️ Vista de contenido de etiquetas
 *
 * Muestra todas las imágenes asociadas a una etiqueta utilizando el componente EntityCard
 */
export function TagContentView() {
	const { currentTagId, currentTag } = useFileManager();

	// Función para cargar imágenes de la etiqueta
	const fetchTagImages = useCallback(async (tagId: string) => {
		const images = await getTagImages(tagId);
		return images as unknown as FileItem[];
	}, []);

	// Renderizar el componente adecuadamente
	return (
		<div className="flex flex-col h-full w-full p-4">
			<h1 className="text-2xl font-bold mb-4">Imágenes con etiqueta: {currentTag?.name || 'Cargando...'}</h1>

			<p className="text-muted-foreground mb-6">{currentTag?.count || 0} imágenes con esta etiqueta</p>

			<div className="text-center mt-8">
				<p className="text-muted-foreground">Componente TagContentView en desarrollo. Próximamente disponible.</p>
			</div>
		</div>
	);
}
