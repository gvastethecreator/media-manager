/**
 * Adaptador específico para el componente AlbumCard
 * Resuelve problemas de compatibilidad entre tipos
 */

import type { Album } from '@prisma/client';
import type { CardOptions } from './unified-card-types';

/**
 * Extiende el tipo Album con propiedades adicionales
 */
export interface ExtendedAlbum extends Omit<Album, '_count' | 'presetId' | 'category'> {
	presetId: string | null;
	imageCount: number;
	category: string | null;
	rating?: number;
	_count?: {
		images?: number;
	};
}

/**
 * Adapta un Album para ser compatible con AlbumCardLayout
 */
export function adaptAlbumForCard(album: Album & { _count: { images: number } }): ExtendedAlbum {
	if (!album) {
		throw new Error('El álbum no puede ser nulo');
	}

	const imageCount = album._count?.images || 0;

	return {
		id: album.id,
		color: album.color,
		name: album.name,
		emoji: album.emoji,
		description: album.description,
		shortcut: album.shortcut,
		sortBy: album.sortBy,
		filters: album.filters,
		createdAt: album.createdAt,
		updatedAt: album.updatedAt,
		category: album.category,
		rarity: album.rarity,
		texture: album.texture,
		presetId: album.presetId,
		imageCount,
	};
}

/**
 * Adapta opciones de tarjeta para ser compatibles con AlbumCardLayout
 */
export function adaptAlbumCardOptions(options: Partial<CardOptions>): Partial<CardOptions> {
	if (!options) return {};

	return {
		...options,
		// Asegurar que el designSystem tiene valores compatibles
		designSystem: options.designSystem
			? {
					preset: options.designSystem.preset || 'album',
					variant: options.designSystem.variant || 'default',
					aspectRatio: options.designSystem.aspectRatio || '1/1',
					cornerStyle: options.designSystem.cornerStyle || 'rounded',
					cornerRadius: options.designSystem.cornerRadius || 12,
					elevation: options.designSystem.elevation || 2,
					shadowStyle: 'soft', // Valor conocido y compatible
					// Propiedades adicionales requeridas
					padding: 'md',
					maxWidth: '100%',
					shadowColor: 'rgba(0,0,0,0.2)',
					shadowOffset: { x: 0, y: 4 },
					shadowBlur: 8,
					borderWidth: 0,
					borderColor: 'transparent',
					backgroundColor: 'transparent',
					backgroundOpacity: 1,
					glassmorphism: false,
					glassmorphismBlur: 0,
				}
			: undefined,

		// Asegurar que holographicOptions usa patternType compatible
		holographicOptions: options.holographicOptions
			? {
					...options.holographicOptions,
					patternType: 'linear', // Valor conocido y compatible
				}
			: undefined,

		// Asegurar que borderOptions tiene valores compatibles
		borderOptions: options.borderOptions
			? {
					...options.borderOptions,
					pattern: 'solid', // Valor conocido y compatible
					width: typeof options.borderOptions.width === 'number' ? options.borderOptions.width : 1,
				}
			: undefined,

		// Estados compatibles
		states: {
			selected: { style: 'border' },
		},
	};
}

export interface AlbumCardProps {
	album: ExtendedAlbum;
}
