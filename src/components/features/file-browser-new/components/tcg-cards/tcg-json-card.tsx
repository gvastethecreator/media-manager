/**
 * @file TCG JSON Card - Tarjeta TCG especializada para archivos JSON
 * @description Card con preview de estructura JSON, validación y schema info
 */

import { BookMarked, Box, Braces, CheckCircle2, FileJson, Hash, Layers, List, Star, Tag, XCircle } from 'lucide-react';
import { memo, useMemo } from 'react';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { JsonFileBrowserItem } from '../../types/item.types';
import { MediaThumbnail } from '../media-thumbnail/media-thumbnail';
import { TCGCardBase, type TCGCardBaseProps } from './tcg-card-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGJsonCardProps extends Omit<TCGCardBaseProps, 'thumbnailContent' | 'footerContent' | 'accentColor'> {
	item: JsonFileBrowserItem;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ACCENT_COLOR = 'var(--entity-json, oklch(0.7 0.2 85))'; // Amarillo/dorado

// ============================================================================
// HELPERS
// ============================================================================

function getRootTypeIcon(rootType: string | null | undefined) {
	switch (rootType) {
		case 'object':
			return Box;
		case 'array':
			return List;
		case 'string':
		case 'number':
		case 'boolean':
			return Hash;
		default:
			return Braces;
	}
}

function formatKeyCount(count: number | null | undefined): string {
	if (!count) return '';
	if (count === 1) return '1 key';
	return `${count} keys`;
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

export const TCGJsonCard = memo(function TCGJsonCard({ item, variant, width, ...props }: TCGJsonCardProps) {
	const json = item.data;
	const isFavorite = json.isFavorite;
	const isValid = json.isValid !== false; // Asume válido si no está definido
	const RootIcon = getRootTypeIcon(json.rootType);
	const relationCounts = useMemo(() => {
		const data = json as Record<string, unknown>;
		return {
			tags: getRelationCount(data, 'tags'),
			albums: getRelationCount(data, 'albums'),
			collections: getRelationCount(data, 'collections'),
		};
	}, [json]);
	const hasRelations = relationCounts.tags + relationCounts.albums + relationCounts.collections > 0;

	// Rareza basada en validación, schema y favorito
	const rarity = useMemo(() => {
		if (json.rating === 5) return 'legendary';
		if (isFavorite || json.rating === 4) return 'epic';
		if (json.schemaType) return 'rare'; // Tiene schema definido
		return 'common';
	}, [json.rating, isFavorite, json.schemaType]);

	// Thumbnail content
	const thumbnailContent = (
		<>
			<MediaThumbnail
				className="h-full w-full"
				item={{
					id: json.id,
					name: json.name,
					entityType: 'jsonFile',
					mimeType: 'application/json',
					thumbnailUrl: json.thumbnailUrl ?? undefined,
				}}
			/>

			{/* Entity badge */}
			<div className="tcg-entity-badge">
				<FileJson />
			</div>

			{/* Validation indicator */}
			<div className="absolute top-6 left-6 z-10" title={isValid ? 'JSON válido' : 'JSON inválido'}>
				{isValid ? (
					<CheckCircle2 className="text-green-500" size={14} />
				) : (
					<XCircle className="text-red-500" size={14} />
				)}
			</div>

			{/* Favorite */}
			{isFavorite && (
				<div className="tcg-favorite-badge">
					<Star fill="currentColor" size={18} />
				</div>
			)}

			{/* Root type badge */}
			{json.rootType && (
				<div className="tcg-stat-badge">
					<RootIcon size={10} />
					<span>{json.rootType}</span>
				</div>
			)}

			{/* JSON preview decorativo */}
			<div className="pointer-events-none absolute inset-4 overflow-hidden font-mono text-[8px] text-foreground leading-tight opacity-20">
				{`{\n  "type": "${json.rootType || 'object'}",\n  "keys": ${json.keyCount || 0},\n  ...\n}`}
			</div>
		</>
	);

	// Footer content
	const footerContent = (
		<>
			{/* Nombre */}
			<span className="truncate font-medium text-foreground text-sm" title={json.name}>
				{json.name}
			</span>

			{/* Info row */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{/* Root type */}
				{json.rootType && (
					<span className="flex items-center gap-1 font-medium">
						<RootIcon size={10} />
						{json.rootType}
					</span>
				)}

				{/* Key count */}
				{json.keyCount && <span className="opacity-70">{formatKeyCount(json.keyCount)}</span>}

				{/* Tamaño */}
				{json.size && <span className="ml-auto opacity-70">{formatFileSize(json.size)}</span>}
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
					{json.schemaType && (
						<span
							className="rounded bg-accent/30 px-1.5 py-0.5 text-accent-foreground"
							title={`Schema: ${json.schemaType}`}
						>
							{json.schemaType}
						</span>
					)}
					{json.depth != null && <span>Depth: {json.depth}</span>}
					{!isValid && json.errorMessage && (
						<span className="truncate text-red-400" title={json.errorMessage}>
							Error: {json.errorMessage}
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
			item={item}
			rarity={rarity}
			thumbnailContent={thumbnailContent}
			variant={variant}
			width={width}
		/>
	);
});
