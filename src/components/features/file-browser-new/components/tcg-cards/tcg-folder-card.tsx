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
		<div className="relative flex h-full w-full flex-col items-center justify-center p-4">
			{/* Folder icon grande */}
			<FolderIcon
				className="text-[color:var(--accent-color)] drop-shadow-lg"
				size={variant === 'list' ? 32 : 64}
				strokeWidth={1.5}
			/>

			{/* Contador total */}
			{stats.total > 0 && (
				<div className="mt-2 flex items-center gap-1 font-medium text-muted-foreground text-sm">
					<Files size={14} />
					<span>{stats.total}</span>
				</div>
			)}

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
			accentColor={ACCENT_COLOR}
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
