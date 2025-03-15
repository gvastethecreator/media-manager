'use client';

import { AlbumCard } from '@/components/features/entity-cards/layouts/album-card-layout';
import { CharacterCard } from '@/components/features/entity-cards/layouts/character-card-layout';
import { CollectionCard } from '@/components/features/entity-cards/layouts/collection-card-layout';
import { ConceptCard } from '@/components/features/entity-cards/layouts/concept-card-layout';
import { FolderCardLayout as FolderCard } from '@/components/features/entity-cards/layouts/folder-card-layout';
import { NoteCard } from '@/components/features/entity-cards/layouts/note-card-layout';
import { PlaceCard } from '@/components/features/entity-cards/layouts/place-card-layout';
import { PromptCard } from '@/components/features/entity-cards/layouts/prompt-card-layout';
import { TagCard } from '@/components/features/entity-cards/layouts/tag-card-layout';
import { WorldItemCard } from '@/components/features/entity-cards/layouts/world-item-card-layout';
import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/types/base-card-types';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { cn } from '@/lib/utils';
import React from 'react';

// Mapeo de tipos de entidad a sus componentes de layout
const ENTITY_LAYOUTS = {
	'card-album': AlbumCard,
	'card-collection': CollectionCard,
	'card-tag': TagCard,
	'card-character': CharacterCard,
	'card-world-item': WorldItemCard,
	'card-place': PlaceCard,
	'card-concept': ConceptCard,
	'card-prompt': PromptCard,
	'card-note': NoteCard,
	'card-folder': FolderCard,
} as const;

// Tipos de datos mock para preview
const MOCK_DATA = {
	'card-album': {
		id: 'preview',
		name: 'Álbum de Ejemplo',
		description: 'Un álbum para visualizar la configuración',
		_count: { images: 42 },
		createdAt: new Date(),
	},
	'card-collection': {
		id: 'preview',
		name: 'Colección de Ejemplo',
		description: 'Una colección para visualizar la configuración',
		_count: { images: 120 },
		totalSize: 1024 * 1024 * 100, // 100MB
	},
	'card-tag': {
		id: 'preview',
		name: 'Etiqueta de Ejemplo',
		type: 'effect',
		description: 'Una etiqueta para visualizar la configuración',
		count: 75,
		rarity: 'rare',
	},
	'card-character': {
		id: 'preview',
		name: 'Personaje de Ejemplo',
		description: 'Un personaje para visualizar la configuración',
		stats: {
			strength: 80,
			dexterity: 70,
			intelligence: 90,
		},
	},
	'card-world-item': {
		id: 'preview',
		name: 'Objeto de Ejemplo',
		description: 'Un objeto para visualizar la configuración',
		type: 'Artefacto',
		rarity: 'legendary',
	},
	'card-place': {
		id: 'preview',
		name: 'Lugar de Ejemplo',
		description: 'Un lugar para visualizar la configuración',
		type: 'Ciudad',
		climate: 'tropical',
	},
	'card-concept': {
		id: 'preview',
		name: 'Concepto de Ejemplo',
		description: 'Un concepto para visualizar la configuración',
		category: 'Filosofía',
	},
	'card-prompt': {
		id: 'preview',
		name: 'Prompt de Ejemplo',
		content: 'Un prompt para visualizar la configuración',
		type: 'text',
	},
	'card-note': {
		id: 'preview',
		title: 'Nota de Ejemplo',
		content: 'Una nota para visualizar la configuración',
		priority: 'high',
	},
	'card-folder': {
		id: 'preview',
		name: 'Carpeta de Ejemplo',
		description: 'Una carpeta para visualizar la configuración',
		_count: { files: 25 },
	},
} as const;

// Datos de prueba para ImageGrid
const MOCK_IMAGES = [
	{
		id: 'mock-image-1',
		path: '/images/mock/image1.jpg',
		thumbnail: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=1',
	},
	{
		id: 'mock-image-2',
		path: '/images/mock/image2.jpg',
		thumbnail: 'https://via.placeholder.com/300x300/10b981/ffffff?text=2',
	},
	{
		id: 'mock-image-3',
		path: '/images/mock/image3.jpg',
		thumbnail: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=3',
	},
	{
		id: 'mock-image-4',
		path: '/images/mock/image4.jpg',
		thumbnail: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=4',
	},
	{
		id: 'mock-image-5',
		path: '/images/mock/image5.jpg',
		thumbnail: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=5',
	},
	{
		id: 'mock-image-6',
		path: '/images/mock/image6.jpg',
		thumbnail: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=6',
	},
];

interface EntityCardPreviewProps {
	cardOptions: CardOptions;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	entityType: keyof typeof ENTITY_LAYOUTS;
	className?: string;
}

export function EntityCardPreview({ cardOptions, rarity, texture, entityType, className }: EntityCardPreviewProps) {
	// Obtener el componente de layout correspondiente
	const LayoutComponent = ENTITY_LAYOUTS[entityType];
	const mockData = MOCK_DATA[entityType];

	// Preparar imágenes para todos los tipos de tarjetas de manera consistente
	const mockImages = MOCK_IMAGES.map((img) => img.thumbnail);

	// Añadir imágenes de prueba para la vista previa
	if (mockData) {
		// Asegurar que todos los tipos de entidad tengan recentImages para ImageGrid
		(mockData as Record<string, unknown>).recentImages = mockImages;

		// Añadir una imagen de portada también si el componente lo usa
		if (!('coverImage' in mockData)) {
			(mockData as Record<string, unknown>).coverImage = mockImages[0];
		}

		// Añadir un contador de imágenes para estadísticas
		if (!('_count' in mockData)) {
			(mockData as Record<string, unknown>)._count = { images: mockImages.length };
		}

		// Añadir propiedades adicionales necesarias para AlbumWithStats
		if (entityType === 'card-album') {
			(mockData as Record<string, unknown>).totalSize = 1024 * 1024 * 50; // 50MB
			(mockData as Record<string, unknown>).lastUpdated = new Date();
			(mockData as Record<string, unknown>).rarity = 'common';
			(mockData as Record<string, unknown>).texture = 'standard';
		}
	}

	if (!LayoutComponent) {
		return (
			<div className="w-full aspect-[2/3] flex items-center justify-center border border-border rounded-lg">
				<p className="text-sm text-muted-foreground">Layout no disponible</p>
			</div>
		);
	}

	// Asegurarse de que cardOptions tenga la configuración de ImageGrid
	const enhancedOptions = {
		...cardOptions,
		// Si useImageGrid no está definido, establecerlo en true para la vista previa
		useImageGrid: cardOptions.useImageGrid !== undefined ? cardOptions.useImageGrid : true,
		// Asegurar que todas las opciones de ImageGrid estén disponibles
		imageGridLayout: cardOptions.imageGridLayout || 'quad',
		imageGridGap: cardOptions.imageGridGap || 4,
		imageGridStyle: cardOptions.imageGridStyle || 'standard',
		// Asegurar que borderOptions.width sea un número definido para evitar conflictos de tipo
		borderOptions: {
			...(cardOptions.borderOptions || {}),
			width: (cardOptions.borderOptions?.width as number) || 2,
			pattern: (cardOptions.borderOptions?.pattern as any) || 'solid',
			animationType: (cardOptions.borderOptions?.animationType as any) || 'none',
			animation: {
				type: (cardOptions.borderOptions?.animation?.type as any) || 'none',
				duration: cardOptions.borderOptions?.animation?.duration || 1000,
				timing: (cardOptions.borderOptions?.animation?.timing as any) || 'linear',
				iteration: (cardOptions.borderOptions?.animation?.iteration as any) || 'infinite',
			},
		},
		// Asegurar que designSystem.shadowStyle sea compatible
		designSystem: {
			...(cardOptions.designSystem || {}),
			// Convertir 'flat' a 'soft' para evitar conflictos de tipo
			shadowStyle:
				cardOptions.designSystem?.shadowStyle === 'flat' ? 'soft' : cardOptions.designSystem?.shadowStyle || 'soft',
		},
	};

	// Usar un enfoque más simple con casting para evitar problemas de tipo
	return (
		<div className={cn('relative w-full max-w-[100%]', className)}>
			{/* Usar casting a any para evitar errores de tipo en la vista previa */}
			{React.createElement(LayoutComponent as any, {
				...(entityType === 'card-tag' ? { tag: mockData } : { data: mockData }),
				isPreview: true,
				options: enhancedOptions,
				rarity,
				texture,
				className: 'w-full border border-border shadow-md max-h-[350px]',
			})}
		</div>
	);
}

// Re-exportar ImageGrid para uso en otros componentes
export { ImageGrid } from '@/components/features/entity-cards/layouts/image-grid';
