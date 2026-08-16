/**
 * @file TCG Video Card - Tarjeta TCG especializada para videos
 * @description Card con preview de video, duración, resolución y codec info
 */

import { BookMarked, Clock, Film, Layers, Maximize2, Play, Star, Tag, Video, Volume2 } from 'lucide-react';
import { memo, useMemo } from 'react';
import { formatDuration, formatFileSize } from '@/lib/utils/format.utils';
import type { VideoBrowserItem } from '../../types/item.types';
import { MediaThumbnail } from '../media-thumbnail/media-thumbnail';
import { TCGCardBase, type TCGCardBaseProps } from './tcg-card-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGVideoCardProps extends Omit<
	TCGCardBaseProps,
	'thumbnailContent' | 'footerContent' | 'accentColor'
> {
	item: VideoBrowserItem;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ACCENT_COLOR = 'var(--entity-video, oklch(0.65 0.2 25))';

// ============================================================================
// HELPERS
// ============================================================================

function formatResolution(width: number | null, height: number | null): string {
	if (!(width && height)) return '';

	// Detectar resoluciones comunes
	if (height >= 2160) return '4K';
	if (height >= 1440) return '2K';
	if (height >= 1080) return '1080p';
	if (height >= 720) return '720p';
	if (height >= 480) return '480p';
	return `${width}×${height}`;
}

function formatCodec(codec: string | null | undefined): string {
	if (!codec) return '';
	const upper = codec.toUpperCase();
	if (upper.includes('H264') || upper.includes('AVC')) return 'H.264';
	if (upper.includes('H265') || upper.includes('HEVC')) return 'H.265';
	if (upper.includes('VP9')) return 'VP9';
	if (upper.includes('AV1')) return 'AV1';
	return codec;
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

export const TCGVideoCard = memo(function TCGVideoCard({ item, variant, width, ...props }: TCGVideoCardProps) {
	const video = item.data;
	const isFavorite = video.isFavorite;
	const resolution = formatResolution(video.width ?? null, video.height ?? null);
	const codec = formatCodec(video.videoCodec);
	const relationCounts = useMemo(() => {
		const data = video as Record<string, unknown>;
		return {
			tags: getRelationCount(data, 'tags'),
			albums: getRelationCount(data, 'albums'),
			collections: getRelationCount(data, 'collections'),
		};
	}, [video]);
	const hasRelations = relationCounts.tags + relationCounts.albums + relationCounts.collections > 0;

	// Rareza basada en resolución y favorito
	const rarity = useMemo(() => {
		if (video.rating === 5) return 'legendary';
		if (isFavorite || video.rating === 4) return 'epic';
		if (resolution === '4K' || resolution === '2K') return 'rare';
		return 'common';
	}, [video.rating, isFavorite, resolution]);

	// Thumbnail content
	const thumbnailContent = (
		<>
			<MediaThumbnail
				animateVideoOnHover
				className="h-full w-full"
				item={{
					id: video.id,
					name: video.name,
					entityType: 'video',
					mimeType: video.mimeType ?? undefined,
					thumbnailUrl: video.thumbnailUrl ?? undefined,
					width: video.width ?? undefined,
					height: video.height ?? undefined,
				}}
			/>

			{/* Entity badge */}
			<div className="tcg-entity-badge">
				<Video />
			</div>

			{/* Favorite */}
			{isFavorite && (
				<div className="tcg-favorite-badge">
					<Star fill="currentColor" size={18} />
				</div>
			)}

			{/* Duration badge */}
			{video.duration && (
				<div className="tcg-stat-badge">
					<Clock size={10} />
					<span>{formatDuration(video.duration)}</span>
				</div>
			)}

			{/* Play overlay indicator */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
					<Play className="ml-1 text-white" fill="white" size={24} />
				</div>
			</div>
		</>
	);

	// Footer content
	const footerContent = (
		<>
			{/* Nombre */}
			<span className="truncate font-medium text-foreground text-sm" title={video.name}>
				{video.name}
			</span>

			{/* Info row */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{/* Resolución */}
				{resolution && (
					<span className="flex items-center gap-1 font-medium">
						<Maximize2 size={10} />
						{resolution}
					</span>
				)}

				{/* Codec */}
				{codec && (
					<span className="flex items-center gap-1 opacity-70">
						<Film size={10} />
						{codec}
					</span>
				)}

				{/* Tamaño */}
				{video.size && <span className="ml-auto opacity-70">{formatFileSize(video.size)}</span>}
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
						<span className="tcg-relations__item" title={`${relationCounts.albums} albums`}>
							<Layers size={10} />
							{relationCounts.albums}
						</span>
					)}
					{relationCounts.collections > 0 && (
						<span className="tcg-relations__item" title={`${relationCounts.collections} collections`}>
							<BookMarked size={10} />
							{relationCounts.collections}
						</span>
					)}
				</div>
			)}

			{/* Extra info en variant card */}
			{variant === 'card' && (
				<div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground/70">
					{video.frameRate && <span>{Math.round(video.frameRate)} fps</span>}
					{video.bitRate && <span>{Math.round(video.bitRate / 1000)} kbps</span>}
					{video.audioCodec && (
						<span className="flex items-center gap-0.5">
							<Volume2 size={9} />
							{video.audioCodec.toUpperCase()}
						</span>
					)}
				</div>
			)}
		</>
	);

	return (
		<TCGCardBase
			{...props}
			accentColor={ACCENT_COLOR}
			className="group"
			footerContent={footerContent}
			item={item}
			rarity={rarity}
			thumbnailContent={thumbnailContent}
			variant={variant}
			width={width}
		/>
	);
});
