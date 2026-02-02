/**
 * @file TCG Document Card - Tarjeta TCG especializada para documentos
 * @description Card con preview de documento, páginas y tipo de archivo
 */

import {
	BookMarked,
	BookOpen,
	FileCode,
	FileSpreadsheet,
	FileText,
	FileType,
	Layers,
	Presentation,
	Star,
	Tag,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { DocumentBrowserItem } from '../../types/item.types';
import { MediaThumbnail } from '../media-thumbnail/media-thumbnail';
import { TCGCardBase, type TCGCardBaseProps } from './tcg-card-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGDocumentCardProps
	extends Omit<TCGCardBaseProps, 'thumbnailContent' | 'footerContent' | 'accentColor'> {
	item: DocumentBrowserItem;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ACCENT_COLOR = 'var(--entity-document, oklch(0.6 0.12 220))';

// ============================================================================
// HELPERS
// ============================================================================

type DocType = 'pdf' | 'word' | 'excel' | 'powerpoint' | 'text' | 'code' | 'other';

function getDocumentType(extension: string | null | undefined): DocType {
	if (!extension) return 'other';
	const ext = extension.toLowerCase();

	if (ext === 'pdf') return 'pdf';
	if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'word';
	if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'excel';
	if (['ppt', 'pptx', 'odp'].includes(ext)) return 'powerpoint';
	if (['txt', 'md', 'markdown'].includes(ext)) return 'text';
	if (['html', 'htm', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg'].includes(ext)) return 'code';

	return 'other';
}

function getDocIcon(type: DocType) {
	switch (type) {
		case 'pdf':
			return FileText;
		case 'word':
			return BookOpen;
		case 'excel':
			return FileSpreadsheet;
		case 'powerpoint':
			return Presentation;
		case 'code':
			return FileCode;
		case 'text':
			return FileType;
		default:
			return FileText;
	}
}

function getDocColor(type: DocType): string {
	switch (type) {
		case 'pdf':
			return 'oklch(0.6 0.2 25)'; // Rojo
		case 'word':
			return 'oklch(0.55 0.2 250)'; // Azul
		case 'excel':
			return 'oklch(0.6 0.2 145)'; // Verde
		case 'powerpoint':
			return 'oklch(0.6 0.2 30)'; // Naranja
		case 'code':
			return 'oklch(0.65 0.15 280)'; // Púrpura
		case 'text':
			return 'oklch(0.6 0.1 220)'; // Azul gris
		default:
			return ACCENT_COLOR;
	}
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

export const TCGDocumentCard = memo(function TCGDocumentCard({ item, variant, width, ...props }: TCGDocumentCardProps) {
	const doc = item.data;
	const isFavorite = doc.isFavorite;
	const docType = getDocumentType(doc.extension);
	const DocIcon = getDocIcon(docType);
	const accentColor = getDocColor(docType);
	const relationCounts = useMemo(() => {
		const data = doc as Record<string, unknown>;
		return {
			tags: getRelationCount(data, 'tags'),
			albums: getRelationCount(data, 'albums'),
			collections: getRelationCount(data, 'collections'),
		};
	}, [doc]);
	const hasRelations = relationCounts.tags + relationCounts.albums + relationCounts.collections > 0;

	// Rareza basada en tipo y favorito
	const rarity = useMemo(() => {
		if (doc.rating === 5) return 'legendary';
		if (isFavorite || doc.rating === 4) return 'epic';
		if (docType === 'pdf') return 'rare';
		return 'common';
	}, [doc.rating, isFavorite, docType]);

	// Thumbnail content
	const thumbnailContent = (
		<>
			<MediaThumbnail
				className="h-full w-full"
				item={{
					id: doc.id,
					name: doc.name,
					entityType: 'document',
					mimeType: doc.mimeType ?? undefined,
					thumbnailUrl: doc.thumbnailUrl ?? undefined,
				}}
			/>

			{/* Entity badge con icono específico */}
			<div className="tcg-entity-badge" style={{ background: accentColor }}>
				<DocIcon />
			</div>

			{/* Favorite */}
			{isFavorite && (
				<div className="tcg-favorite-badge">
					<Star fill="currentColor" size={18} />
				</div>
			)}

			{/* Page count badge (si existe) */}
			{doc.pageCount && (
				<div className="tcg-stat-badge">
					<BookOpen size={10} />
					<span>{doc.pageCount} pág</span>
				</div>
			)}
		</>
	);

	// Footer content
	const footerContent = (
		<>
			{/* Nombre */}
			<span className="truncate font-medium text-foreground text-sm" title={doc.name}>
				{doc.name}
			</span>

			{/* Info row */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{/* Tipo */}
				{doc.extension && (
					<span
						className="rounded px-1.5 py-0.5 font-medium text-[10px] uppercase"
						style={{
							background: `color-mix(in oklch, ${accentColor} 20%, transparent)`,
							color: accentColor,
						}}
					>
						{doc.extension}
					</span>
				)}

				{/* Tamaño */}
				{doc.size && <span className="ml-auto opacity-70">{formatFileSize(doc.size)}</span>}
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
					{doc.title && doc.title !== doc.name && (
						<span className="truncate" title={doc.title}>
							{doc.title}
						</span>
					)}
					{doc.author && (
						<span className="truncate" title={doc.author}>
							por {doc.author}
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
			item={item}
			rarity={rarity}
			thumbnailContent={thumbnailContent}
			variant={variant}
			width={width}
		/>
	);
});
