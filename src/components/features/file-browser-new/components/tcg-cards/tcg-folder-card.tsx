/**
 * @file TCG Folder Card - Tarjeta TCG especializada para carpetas
 * @description Card con contador de contenido y preview de items
 */

import { Box, Braces, Files, FileText, Folder, FolderOpen, Image as ImageIcon, Music, Star, Video } from 'lucide-react';
import { memo, useMemo } from 'react';
import type { FolderBrowserItem } from '../../types/item.types';
import { TCGCardBase, type TCGCardBaseProps } from './tcg-card-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGFolderCardProps extends Omit<
	TCGCardBaseProps,
	'thumbnailContent' | 'footerContent' | 'accentColor'
> {
	item: FolderBrowserItem;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ACCENT_COLOR = 'var(--entity-folder, oklch(0.7 0.15 55))'; // Naranja/marrón

const PAPER_TRANSFORMS = [
	'rotate(-8deg) translate(-22%, -6%)',
	'rotate(-2deg) translate(-6%, -2%)',
	'rotate(7deg) translate(14%, -4%)',
] as const;

const PAPER_POSITIONS = ['18% 28%', '50% 38%', '82% 50%'] as const;

// ============================================================================
// HELPERS
// ============================================================================

interface FolderStats {
	audios?: number;
	documents?: number;
	file3ds?: number;
	images?: number;
	jsonFiles?: number;
	total: number;
	videos?: number;
}

function getFolderStats(folder: FolderBrowserItem['data']): FolderStats {
	const counts = folder._count || {};
	return {
		images: counts.images ?? 0,
		videos: counts.videos ?? 0,
		audios: counts.audios ?? 0,
		documents: counts.documents ?? 0,
		jsonFiles: counts.jsonFiles ?? 0,
		file3ds: counts.file3ds ?? 0,
		total:
			(counts.images ?? 0) +
			(counts.videos ?? 0) +
			(counts.audios ?? 0) +
			(counts.documents ?? 0) +
			(counts.jsonFiles ?? 0) +
			(counts.file3ds ?? 0),
	};
}

function normalizePreviewUrl(raw: unknown): string | null {
	if (typeof raw !== 'string') {
		return null;
	}

	const trimmed = raw.trim();
	if (!trimmed) {
		return null;
	}

	if (trimmed.startsWith('data:') || /^(https?:|blob:|file:|\/)/i.test(trimmed)) {
		return trimmed;
	}

	const base64 = trimmed.replace(/\s+/g, '');
	return `data:image/webp;base64,${base64}`;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const TCGFolderCard = memo(function TCGFolderCard({
	item,
	variant,
	width,
	isActive,
	...props
}: TCGFolderCardProps) {
	const folder = item.data;
	const isFavorite = folder.isFavorite;
	const stats = getFolderStats(folder);
	const accentColor = folder.color || ACCENT_COLOR;

	const previewImages = useMemo(() => {
		const images = Array.isArray(folder.recentImages)
			? folder.recentImages
					.map((image, index) => ({
						id: image.id ?? `recent-${index}`,
						url: normalizePreviewUrl(image.thumbnailUrl ?? image.thumbnail),
					}))
					.filter((image): image is { id: string; url: string } => image.url !== null)
			: [];

		if (images.length > 0) {
			return images.slice(0, PAPER_TRANSFORMS.length);
		}

		const fallbackUrl = normalizePreviewUrl(item.thumbnailUrl);
		if (!fallbackUrl) {
			return [];
		}

		return PAPER_TRANSFORMS.map((_, index) => ({
			id: `fallback-${index}`,
			url: fallbackUrl,
		}));
	}, [folder.recentImages, item.thumbnailUrl]);

	// Rareza basada en cantidad de contenido y favorito
	const rarity = useMemo(() => {
		if (folder.rating === 5) return 'legendary';
		if (isFavorite || folder.rating === 4) return 'epic';
		if (stats.total > 100) return 'rare';
		return 'common';
	}, [folder.rating, isFavorite, stats.total]);

	// Ícono de folder basado en estado
	const FolderIcon = isActive ? FolderOpen : Folder;

	// Thumbnail content (folder visual)
	const thumbnailContent = (
		<div className="relative h-full w-full overflow-hidden p-4">
			<div className="absolute inset-0 bg-linear-to-br from-black/15 via-transparent to-black/45" />

			<div
				className="absolute left-[14%] top-[12%] h-[14%] w-[30%] rounded-t-2xl border border-white/12"
				style={{
					background:
						'linear-gradient(180deg, color-mix(in oklch, var(--accent-color) 86%, white 14%) 0%, color-mix(in oklch, var(--accent-color) 72%, white 28%) 100%)',
					boxShadow: '0 10px 24px color-mix(in oklch, var(--accent-color) 24%, transparent)',
				}}
			/>

			<div
				className="absolute inset-x-[10%] bottom-[14%] top-[22%] rounded-3xl border border-white/12"
				style={{
					background:
						'linear-gradient(180deg, color-mix(in oklch, var(--accent-color) 90%, white 10%) 0%, color-mix(in oklch, var(--accent-color) 72%, black 28%) 100%)',
					boxShadow:
						'0 18px 42px color-mix(in oklch, var(--accent-color) 26%, transparent), inset 0 1px 0 color-mix(in oklch, white 16%, transparent)',
				}}
			/>

			<div className="absolute inset-x-[15%] bottom-[23%] top-[29%]">
				{previewImages.length > 0 ? (
					previewImages.map((preview, index) => (
						<div
							className="absolute left-1/2 top-1/2 h-[82%] w-[68%] overflow-hidden rounded-2xl border border-white/16 bg-white shadow-2xl"
							key={preview.id}
							style={{
								transform: `translate(-50%, -50%) ${PAPER_TRANSFORMS[index]}`,
								zIndex: index + 1,
							}}
						>
							<div
								className="absolute inset-0 bg-cover bg-center"
								style={{
									backgroundImage: `url("${preview.url}")`,
									backgroundPosition: PAPER_POSITIONS[index],
								}}
							/>
							<div className="absolute inset-0 bg-linear-to-br from-white/28 via-transparent to-black/18" />
						</div>
					))
				) : (
					<div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-white/16 bg-black/15 text-white/78">
						<FolderIcon size={variant === 'list' ? 28 : 42} strokeWidth={1.6} />
					</div>
				)}
			</div>

			<div
				className="absolute inset-x-[11%] bottom-[14%] top-[31%] rounded-[1.45rem] border border-white/18 backdrop-blur-[1.5px]"
				style={{
					background:
						'linear-gradient(180deg, color-mix(in oklch, var(--accent-color) 34%, white 66%) 0%, color-mix(in oklch, var(--accent-color) 46%, white 54%) 100%)',
					opacity: 0.72,
				}}
			/>

			<div className="absolute left-[16%] top-[18%] flex items-center gap-2 text-white drop-shadow-md">
				<FolderIcon size={variant === 'list' ? 16 : 18} strokeWidth={1.7} />
				<span className="font-semibold text-xs uppercase tracking-[0.22em] text-white/86">Folder</span>
			</div>

			{stats.total > 0 && (
				<div className="absolute left-[16%] bottom-[18%] flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 font-medium text-[11px] text-white shadow-lg backdrop-blur-sm">
					<Files size={12} />
					<span>{stats.total}</span>
				</div>
			)}

			{previewImages.length > 0 && (
				<div className="absolute right-[16%] bottom-[18%] rounded-full border border-white/15 bg-white/12 px-2 py-1 text-[10px] text-white/88 shadow-lg backdrop-blur-sm">
					{previewImages.length} preview{previewImages.length > 1 ? 's' : ''}
				</div>
			)}

			<div
				className="absolute inset-x-[10%] bottom-[14%] top-[22%] rounded-3xl"
				style={{
					boxShadow:
						'inset 0 1px 0 color-mix(in oklch, white 12%, transparent), inset 0 -16px 28px color-mix(in oklch, black 12%, transparent)',
				}}
			/>

			{/* Favorite */}
			{isFavorite && (
				<div className="tcg-favorite-badge">
					<Star fill="currentColor" size={18} />
				</div>
			)}

			{/* Mini badges de contenido */}
			{stats.total > 0 && variant !== 'list' && (
				<div className="absolute right-2 bottom-2 left-2 flex flex-wrap items-center justify-center gap-1">
					{stats.images! > 0 && (
						<span className="flex items-center gap-0.5 rounded bg-black/30 px-1 py-0.5 text-[10px] text-white">
							<ImageIcon size={10} />
							{stats.images}
						</span>
					)}
					{stats.videos! > 0 && (
						<span className="flex items-center gap-0.5 rounded bg-black/30 px-1 py-0.5 text-[10px] text-white">
							<Video size={10} />
							{stats.videos}
						</span>
					)}
					{stats.audios! > 0 && (
						<span className="flex items-center gap-0.5 rounded bg-black/30 px-1 py-0.5 text-[10px] text-white">
							<Music size={10} />
							{stats.audios}
						</span>
					)}
					{stats.documents! > 0 && (
						<span className="flex items-center gap-0.5 rounded bg-black/30 px-1 py-0.5 text-[10px] text-white">
							<FileText size={10} />
							{stats.documents}
						</span>
					)}
					{stats.jsonFiles! > 0 && (
						<span className="flex items-center gap-0.5 rounded bg-black/30 px-1 py-0.5 text-[10px] text-white">
							<Braces size={10} />
							{stats.jsonFiles}
						</span>
					)}
					{stats.file3ds! > 0 && (
						<span className="flex items-center gap-0.5 rounded bg-black/30 px-1 py-0.5 text-[10px] text-white">
							<Box size={10} />
							{stats.file3ds}
						</span>
					)}
				</div>
			)}
		</div>
	);

	// Footer content
	const footerContent = (
		<>
			{/* Nombre */}
			<span className="truncate font-medium text-foreground text-sm" title={folder.name}>
				{folder.name}
			</span>

			{/* Info row */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{/* Total items */}
				<span className="flex items-center gap-1">
					<Files size={10} />
					{stats.total} {stats.total === 1 ? 'item' : 'items'}
				</span>

				{/* Desglose por tipo (resumido) */}
				{variant === 'card' && (
					<div className="ml-auto flex items-center gap-1.5 opacity-70">
						{stats.images! > 0 && (
							<span className="flex items-center gap-0.5">
								<ImageIcon size={10} />
								{stats.images}
							</span>
						)}
						{stats.videos! > 0 && (
							<span className="flex items-center gap-0.5">
								<Video size={10} />
								{stats.videos}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Extra info en variant card */}
			{variant === 'card' && (
				<div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/70">
					{stats.audios! > 0 && (
						<span className="flex items-center gap-0.5">
							<Music size={9} />
							{stats.audios}
						</span>
					)}
					{stats.documents! > 0 && (
						<span className="flex items-center gap-0.5">
							<FileText size={9} />
							{stats.documents}
						</span>
					)}
					{stats.jsonFiles! > 0 && (
						<span className="flex items-center gap-0.5">
							<Braces size={9} />
							{stats.jsonFiles}
						</span>
					)}
					{stats.file3ds! > 0 && (
						<span className="flex items-center gap-0.5">
							<Box size={9} />
							{stats.file3ds}
						</span>
					)}
				</div>
			)}
		</>
	);

	return (
		<TCGCardBase
			{...props}
			accentColor={accentColor}
			footerContent={footerContent}
			isActive={isActive}
			item={item}
			rarity={rarity}
			thumbnailContent={thumbnailContent}
			variant={variant}
			width={width}
		/>
	);
});
