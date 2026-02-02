/**
 * @file TCG 3D Card - Tarjeta TCG especializada para archivos 3D
 * @description Card con preview 3D, polígonos, texturas y formato info
 */

import { BookMarked, Box, Cpu, Grid3X3, Layers, Palette, Star, Tag } from 'lucide-react';
import { memo, useMemo } from 'react';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { File3DBrowserItem } from '../../types/item.types';
import { MediaThumbnail } from '../media-thumbnail/media-thumbnail';
import { TCGCardBase, type TCGCardBaseProps } from './tcg-card-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCG3DCardProps extends Omit<TCGCardBaseProps, 'thumbnailContent' | 'footerContent' | 'accentColor'> {
	item: File3DBrowserItem;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ACCENT_COLOR = 'var(--entity-3d, oklch(0.65 0.2 180))'; // Cyan

// ============================================================================
// HELPERS
// ============================================================================

function formatPolygons(count: number | null | undefined): string {
	if (!count) return '';
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
	if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
	return count.toString();
}

function getFormatColor(format: string | null | undefined): string {
	if (!format) return ACCENT_COLOR;
	const fmt = format.toLowerCase();

	if (['glb', 'gltf'].includes(fmt)) return 'oklch(0.65 0.2 150)'; // Verde
	if (['fbx'].includes(fmt)) return 'oklch(0.6 0.2 30)'; // Naranja
	if (['obj'].includes(fmt)) return 'oklch(0.6 0.15 250)'; // Azul
	if (['stl'].includes(fmt)) return 'oklch(0.55 0.1 280)'; // Púrpura
	if (['usdz', 'usda', 'usdc'].includes(fmt)) return 'oklch(0.7 0.2 60)'; // Amarillo

	return ACCENT_COLOR;
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

export const TCG3DCard = memo(function TCG3DCard({ item, variant, width, ...props }: TCG3DCardProps) {
	const file3d = item.data;
	const isFavorite = file3d.isFavorite;
	const formatColor = getFormatColor(file3d.extension);
	const polyCount = formatPolygons(file3d.polygonCount);
	const relationCounts = useMemo(() => {
		const data = file3d as Record<string, unknown>;
		return {
			tags: getRelationCount(data, 'tags'),
			albums: getRelationCount(data, 'albums'),
			collections: getRelationCount(data, 'collections'),
		};
	}, [file3d]);
	const hasRelations = relationCounts.tags + relationCounts.albums + relationCounts.collections > 0;

	// Rareza basada en complejidad y favorito
	const rarity = useMemo(() => {
		if (file3d.rating === 5) return 'legendary';
		if (isFavorite || file3d.rating === 4) return 'epic';
		// Alta complejidad = rare
		if (file3d.polygonCount && file3d.polygonCount > 100_000) return 'rare';
		return 'common';
	}, [file3d.rating, isFavorite, file3d.polygonCount]);

	// Thumbnail content
	const thumbnailContent = (
		<>
			<MediaThumbnail
				className="h-full w-full"
				item={{
					id: file3d.id,
					name: file3d.name,
					entityType: 'file3d',
					mimeType: file3d.mimeType ?? undefined,
					thumbnailUrl: file3d.thumbnailUrl ?? undefined,
				}}
			/>

			{/* Entity badge */}
			<div className="tcg-entity-badge" style={{ background: formatColor }}>
				<Box />
			</div>

			{/* Favorite */}
			{isFavorite && (
				<div className="tcg-favorite-badge">
					<Star fill="currentColor" size={18} />
				</div>
			)}

			{/* Polygon count badge */}
			{polyCount && (
				<div className="tcg-stat-badge">
					<Grid3X3 size={10} />
					<span>{polyCount} polys</span>
				</div>
			)}

			{/* 3D wireframe decorative overlay */}
			<div className="pointer-events-none absolute inset-0 opacity-10">
				<svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
					{/* Cube wireframe */}
					<g className="text-white" fill="none" stroke="currentColor" strokeWidth="0.5">
						{/* Front face */}
						<path d="M 30 40 L 70 40 L 70 80 L 30 80 Z" />
						{/* Back face */}
						<path d="M 40 30 L 80 30 L 80 70 L 40 70 Z" />
						{/* Connecting lines */}
						<line x1="30" x2="40" y1="40" y2="30" />
						<line x1="70" x2="80" y1="40" y2="30" />
						<line x1="70" x2="80" y1="80" y2="70" />
						<line x1="30" x2="40" y1="80" y2="70" />
					</g>
				</svg>
			</div>
		</>
	);

	// Footer content
	const footerContent = (
		<>
			{/* Nombre */}
			<span className="truncate font-medium text-foreground text-sm" title={file3d.name}>
				{file3d.name}
			</span>

			{/* Info row */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{/* Formato */}
				{file3d.extension && (
					<span
						className="rounded px-1.5 py-0.5 font-medium text-[10px] uppercase"
						style={{
							background: `color-mix(in oklch, ${formatColor} 20%, transparent)`,
							color: formatColor,
						}}
					>
						{file3d.extension}
					</span>
				)}

				{/* Polygons */}
				{polyCount && (
					<span className="flex items-center gap-1 opacity-70">
						<Grid3X3 size={10} />
						{polyCount}
					</span>
				)}

				{/* Tamaño */}
				{file3d.size && <span className="ml-auto opacity-70">{formatFileSize(file3d.size)}</span>}
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
					{file3d.vertexCount && (
						<span className="flex items-center gap-0.5">
							<Cpu size={9} />
							{formatPolygons(file3d.vertexCount)} verts
						</span>
					)}
					{file3d.materialCount && (
						<span className="flex items-center gap-0.5">
							<Palette size={9} />
							{file3d.materialCount} mats
						</span>
					)}
					{file3d.meshCount && (
						<span className="flex items-center gap-0.5">
							<Layers size={9} />
							{file3d.meshCount} meshes
						</span>
					)}
					{file3d.hasAnimations && <span className="text-green-400">Animated</span>}
				</div>
			)}
		</>
	);

	return (
		<TCGCardBase
			{...props}
			accentColor={formatColor}
			footerContent={footerContent}
			item={item}
			rarity={rarity}
			thumbnailContent={thumbnailContent}
			variant={variant}
			width={width}
		/>
	);
});
