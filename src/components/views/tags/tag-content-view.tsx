'use client';

import { getTagImages } from '@/app/actions/tags/tag.actions';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { EntityContentView } from '@/components/views/base/entity-content-view-template';
import { useFileManager } from '@/store/file-manager.store';
import type { FileItem } from '@/types/file-item';
import { TagIcon } from 'lucide-react';
import { useCallback } from 'react';

// Configuración visual predeterminada para imágenes de etiquetas
const DEFAULT_TAG_IMAGE_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: false,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: false,
	designSystem: {
		preset: 'image',
		variant: 'default',
		aspectRatio: '1/1',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'border', 'filter'],
		layerBlending: 'normal',
		layerSpacing: 1,
	},
	primaryColor: '#3b82f6',
	secondaryColor: '#10b981',
	hoverLiftHeight: 5,
	maxRotation: 8,
};

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

	return (
		<EntityContentView<FileItem>
			emptyStateIcon={TagIcon}
			emptyStateTitle="No hay imágenes con esta etiqueta"
			emptyStateDescription="Esta etiqueta no tiene imágenes asociadas"
			entityId={currentTagId}
			entityName={currentTag?.name || 'etiqueta'}
			fetchRelatedItems={fetchTagImages}
			entityType="image"
			defaultOptions={DEFAULT_TAG_IMAGE_OPTIONS}
			visualConfigEndpoint="/api/entities/images/visual-config"
		/>
	);
}
