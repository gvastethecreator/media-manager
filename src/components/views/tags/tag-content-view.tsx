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

}
