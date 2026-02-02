/**
 * @file TCG Image Card - Tarjeta TCG especializada para imágenes
 * @description Card con preview de imagen, EXIF info, y efectos visuales
 */

import { Aperture, BookMarked, Camera, FileType, ImageIcon, Layers, Maximize2, Star, Sun, Tag } from 'lucide-react';
import { memo, useMemo } from 'react';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { ImageBrowserItem } from '../../types/item.types';
import { MediaThumbnail } from '../media-thumbnail/media-thumbnail';
import { TCGCardBase, type TCGCardBaseProps } from './tcg-card-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGImageCardProps
	extends Omit<TCGCardBaseProps, 'thumbnailContent' | 'footerContent' | 'accentColor'> {
	item: ImageBrowserItem;
	/** Mostrar metadatos EXIF */
	showExif?: boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ACCENT_COLOR = 'var(--entity-image, oklch(0.7 0.15 280))';

// ============================================================================
// HELPERS
// ============================================================================

function formatExposure(exposure: number | undefined | null): string {
	if (!exposure) return '';
	if (exposure >= 1) return `${exposure}s`;
	return `1/${Math.round(1 / exposure)}`;
}

function formatFocalLength(focal: number | undefined | null): string {
	if (!focal) return '';
	return `${focal}mm`;
}

function getRelationCount(data: Record<string, unknown>, key: string): number {
	const direct = data[key];
	if (Array.isArray(direct)) return direct.length;
	if (typeof direct === 'number') return direct;
	const count = (data as { _count?: Record<string, number | undefined> })._count?.[key];
	return typeof count === 'number' ? count : 0;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const TCGImageCard = memo(function TCGImageCard({
	item,
	variant,
	width,
	showExif = true,
	...props
}: TCGImageCardProps) {
	const image = item.data;
	const hasExif = showExif && (image.cameraMake || image.fNumber || image.iso);
	const isFavorite = image.isFavorite;
	const relationCounts = useMemo(() => {
		const data = image as Record<string, unknown>;
		return {
			tags: getRelationCount(data, 'tags'),
			albums: getRelationCount(data, 'albums'),
			collections: getRelationCount(data, 'collections'),
		};
	}, [image]);
	const hasRelations = relationCounts.tags + relationCounts.albums + relationCounts.collections > 0;

	// Calcular rareza basada en rating/favorito
	const rarity = useMemo(() => {
		if (image.rating === 5) return 'legendary';
		if (image.rating === 4 || isFavorite) return 'epic';
		if (image.rating === 3) return 'rare';
		return 'common';
	}, [image.rating, isFavorite]);

	// Thumbnail content
	const thumbnailContent = (
		<>
			<MediaThumbnail
				className="h-full w-full"
				item={{
					id: image.id,
					name: image.name,
					entityType: 'image',
					mimeType: image.mimeType ?? undefined,
					thumbnailUrl: image.thumbnailUrl ?? undefined,
					width: image.width ?? undefined,
					height: image.height ?? undefined,
				}}
			/>

			{/* Entity badge */}
			<div className="tcg-entity-badge">
				<ImageIcon />
			</div>

			{/* Favorite */}
			{isFavorite && (
				<div className="tcg-favorite-badge">
					<Star fill="currentColor" size={18} />
				</div>
			)}

			{/* Dimensions badge */}
			{image.width && image.height && (
				<div className="tcg-stat-badge">
					<Maximize2 size={10} />
					<span>
						{image.width}×{image.height}
					</span>
				</div>
			)}
		</>
	);

	// Footer content
	const footerContent = (
		<>
			{/* Nombre */}
			<span className="truncate font-medium text-foreground text-sm" title={image.name}>
				{image.name}
			</span>

			{/* Info row */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{/* Formato y tamaño */}
				<span className="flex items-center gap-1">
					<FileType size={10} />
					{image.extension?.toUpperCase()}
				</span>
				{image.size && <span className="opacity-70">{formatFileSize(image.size)}</span>}

				{/* EXIF mini */}
				{hasExif && variant === 'card' && (
					<div className="ml-auto flex items-center gap-2 opacity-60">
						{image.cameraMake && (
							<span className="flex items-center gap-0.5" title={image.cameraMake}>
								<Camera size={10} />
							</span>
						)}
						{image.fNumber && (
							<span title={`f/${image.fNumber}`}>
								<Aperture size={10} />
							</span>
						)}
						{image.iso && (
							<span title={`ISO ${image.iso}`}>
								<Sun size={10} />
							</span>
						)}
					</div>
				)}
			</div>

			{hasRelations && variant !== 'list' && variant !== 'masonry' && (
				<div className="tcg-relations">
					{relationCounts.tags > 0 && (
						<span className="tcg-relations__item" title={`${relationCounts.tags} tags`}>
							<Tag size={10} />
							{relationCounts.tags}
						</span>
					)}
					{relationCounts.albums > 0 && (
						<span className="tcg-relations__item" title={`${relationCounts.albums} álbumes`}>
							<Layers size={10} />
							{relationCounts.albums}
						</span>
					)}
					{relationCounts.collections > 0 && (
						<span className="tcg-relations__item" title={`${relationCounts.collections} colecciones`}>
							<BookMarked size={10} />
							{relationCounts.collections}
						</span>
					)}
				</div>
			)}

			{/* EXIF detallado solo en variant card */}
			{hasExif && variant === 'card' && (
				<div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground/70">
					{image.fNumber && <span>f/{image.fNumber}</span>}
					{image.exposureTime && <span>{formatExposure(image.exposureTime)}</span>}
					{image.iso && <span>ISO {image.iso}</span>}
					{image.focalLength && <span>{formatFocalLength(image.focalLength)}</span>}
				</div>
			)}
		</>
	);

	return (
		<TCGCardBase
			{...props}
			accentColor={ACCENT_COLOR}
			footerContent={footerContent}
			item={item}
			rarity={rarity}
			thumbnailContent={thumbnailContent}
			variant={variant}
			width={width}
		/>
	);
});
