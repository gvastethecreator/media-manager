/**
 * @file TCG Audio Card - Tarjeta TCG especializada para audio
 * @description Card con waveform visual, duración, bitrate y metadata
 */

import { BookMarked, Clock, Disc, Headphones, Layers, Mic2, Music, Radio, Star, Tag } from 'lucide-react';
import { memo, useMemo } from 'react';
import { formatDuration, formatFileSize } from '@/lib/utils/format.utils';
import type { AudioBrowserItem } from '../../types/item.types';
import { MediaThumbnail } from '../media-thumbnail/media-thumbnail';
import { TCGCardBase, type TCGCardBaseProps } from './tcg-card-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGAudioCardProps
	extends Omit<TCGCardBaseProps, 'thumbnailContent' | 'footerContent' | 'accentColor'> {
	item: AudioBrowserItem;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ACCENT_COLOR = 'var(--entity-audio, oklch(0.7 0.18 150))';

// ============================================================================
// HELPERS
// ============================================================================

function formatBitrate(bitrate: number | null | undefined): string {
	if (!bitrate) return '';
	return `${Math.round(bitrate / 1000)} kbps`;
}

function formatSampleRate(rate: number | null | undefined): string {
	if (!rate) return '';
	return `${(rate / 1000).toFixed(1)} kHz`;
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

export const TCGAudioCard = memo(function TCGAudioCard({ item, variant, width, ...props }: TCGAudioCardProps) {
	const audio = item.data;
	const isFavorite = audio.isFavorite;
	const hasMetadata = audio.artist || audio.album || audio.title;
	const relationCounts = useMemo(() => {
		const data = audio as Record<string, unknown>;
		return {
			tags: getRelationCount(data, 'tags'),
			albums: getRelationCount(data, 'albums'),
			collections: getRelationCount(data, 'collections'),
		};
	}, [audio]);
	const hasRelations = relationCounts.tags + relationCounts.albums + relationCounts.collections > 0;

	// Rareza basada en bitrate y favorito
	const rarity = useMemo(() => {
		if (audio.rating === 5) return 'legendary';
		if (isFavorite || audio.rating === 4) return 'epic';
		// Lossless o high bitrate
		if (audio.bitRate && audio.bitRate > 256_000) return 'rare';
		return 'common';
	}, [audio.rating, isFavorite, audio.bitRate]);

	// Display name (usa title de metadata si existe)
	const displayName = audio.title || audio.name;
	const displayArtist = audio.artist || audio.albumArtist;

	// Thumbnail content
	const thumbnailContent = (
		<>
			<MediaThumbnail
				className="h-full w-full"
				item={{
					id: audio.id,
					name: displayName,
					entityType: 'audio',
					mimeType: audio.mimeType ?? undefined,
					thumbnailUrl: audio.thumbnailUrl ?? undefined,
				}}
			/>

			{/* Entity badge */}
			<div className="tcg-entity-badge">
				<Music />
			</div>

			{/* Favorite */}
			{isFavorite && (
				<div className="tcg-favorite-badge">
					<Star fill="currentColor" size={18} />
				</div>
			)}

			{/* Duration badge */}
			{audio.duration && (
				<div className="tcg-stat-badge">
					<Clock size={10} />
					<span>{formatDuration(audio.duration)}</span>
				</div>
			)}

			{/* Waveform visual decorative */}
			<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 opacity-40">
				<svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 20">
					<path
						className="text-white"
						d="M0,10 Q5,5 10,10 T20,10 T30,10 T40,10 T50,10 T60,10 T70,10 T80,10 T90,10 T100,10"
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
					/>
					{/* Random bars para simular waveform */}
					{Array.from({ length: 50 }).map((_, i) => (
						<rect
							className="text-white opacity-60"
							fill="currentColor"
							height={Math.random() * 16}
							key={i}
							width="1"
							x={i * 2}
							y={10 - Math.random() * 8}
						/>
					))}
				</svg>
			</div>
		</>
	);

	// Footer content
	const footerContent = (
		<>
			{/* Título/Nombre */}
			<span className="truncate font-medium text-foreground text-sm" title={displayName}>
				{displayName}
			</span>

			{/* Artista */}
			{displayArtist && (
				<span className="flex items-center gap-1 truncate text-muted-foreground text-xs" title={displayArtist}>
					<Mic2 size={10} />
					{displayArtist}
				</span>
			)}

			{/* Info row */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{/* Formato */}
				{audio.extension && <span className="font-medium uppercase">{audio.extension}</span>}

				{/* Bitrate */}
				{audio.bitRate && (
					<span className="flex items-center gap-1 opacity-70">
						<Radio size={10} />
						{formatBitrate(audio.bitRate)}
					</span>
				)}

				{/* Tamaño */}
				{audio.size && <span className="ml-auto opacity-70">{formatFileSize(audio.size)}</span>}
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

			{/* Extra info en variant card */}
			{variant === 'card' && (
				<div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground/70">
					{audio.album && (
						<span className="flex items-center gap-0.5 truncate" title={audio.album}>
							<Disc size={9} />
							{audio.album}
						</span>
					)}
					{audio.sampleRate && (
						<span className="flex items-center gap-0.5">
							<Headphones size={9} />
							{formatSampleRate(audio.sampleRate)}
						</span>
					)}
					{audio.channels && <span>{audio.channels}ch</span>}
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
