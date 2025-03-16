'use client';

import { getTags } from '@/app/actions/tags/tag.actions';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { EntityView } from '@/components/views/base/entity-view-template';
import { useFileManager } from '@/store/file-manager.store';
import { TagIcon } from 'lucide-react';
import { useCallback } from 'react';
import type { ViewProps } from '../types';

// Configuración visual predeterminada para etiquetas
const DEFAULT_TAG_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'tag',
		variant: 'default',
		aspectRatio: '4/3',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#3b82f6',
	secondaryColor: '#10b981',
	hoverLiftHeight: 8,
	maxRotation: 12,
};

// Definir los tipos de etiquetas permitidos
type TagType = 'normal' | 'trap' | 'spell' | 'effect' | 'ritual';

// Extender el tipo Tag para incluir campos adicionales
interface TagWithDetails {
	id: string;
	name: string;
	description?: string | null;
	type?: string | null;
	category?: string | null;
	color?: string | null;
	_count?: { images: number };
	count?: number;
	recentImages?: string[];
	createdAt: Date;
	updatedAt: Date;
}

// Función para determinar el tipo de etiqueta basado en categoría o alguna propiedad
const getTagType = (category?: string | null): TagType => {
	if (!category) {
		return 'normal';
	}

	// Mapeo simple de categorías a tipos
	switch (category.toLowerCase()) {
		case 'trap':
		case 'trampa': {
			return 'trap';
		}
		case 'spell':
		case 'hechizo':
		case 'magic':
		case 'magia': {
			return 'spell';
		}
		case 'effect':
		case 'efecto': {
			return 'effect';
		}
		case 'ritual': {
			return 'ritual';
		}
		default: {
			return 'normal';
		}
	}
};

/**
 * 🏷️ Vista de etiquetas
 *
 * Muestra todas las etiquetas disponibles en el sistema utilizando el componente EntityCard
 */
export function TagsView(props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentTag } = useFileManager();

	// Función para cargar etiquetas
	const fetchTags = useCallback(async () => {
		const data = await getTags();

		// Transformar los datos para adaptarlos al formato esperado
		return data.map((tagData) => {
			// Filtrar valores nulos en recentImages
			const recentImages = tagData.recentImages
				? tagData.recentImages.filter((img): img is string => img !== null)
				: [];

			return {
				...tagData,
				recentImages,
				_count: tagData._count || { images: tagData.count || 0 },
				// Usar la función para determinar el tipo de etiqueta
				type: getTagType(tagData.category),
				createdAt: new Date(tagData.createdAt),
				updatedAt: new Date(tagData.updatedAt),
			} as TagWithDetails;
		});
	}, []);

	// Manejar el clic en una etiqueta
	const handleTagClick = useCallback(
		(tag: TagWithDetails) => {
			setCurrentView('tag-content');
			setCurrentTag(tag.id);
			// Actualizar la información completa de la etiqueta en el store
			useFileManager.setState({
				currentTag: {
					id: tag.id,
					name: tag.name,
					description: tag.description,
					type: tag.type,
					category: tag.category,
					color: tag.color,
					_count: tag._count,
					createdAt: tag.createdAt,
					updatedAt: tag.updatedAt,
				},
			});
		},
		[setCurrentView, setCurrentTag]
	);

	return (
		<EntityView<TagWithDetails>
			{...props}
			title="Etiquetas"
			description="Organiza y filtra tus imágenes con etiquetas personalizadas"
			emptyStateIcon={TagIcon}
			emptyStateTitle="No hay etiquetas creadas"
			emptyStateDescription="Crea etiquetas para categorizar y filtrar tus imágenes."
			fetchEntities={fetchTags}
			onEntityClick={handleTagClick}
			entityType="tag"
			defaultOptions={DEFAULT_TAG_OPTIONS}
			visualConfigEndpoint="/api/entities/tags/visual-config"
		/>
	);
}
