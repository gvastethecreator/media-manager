/**
 * @file TCG Card Renderer - Renderiza la card TCG correcta según el tipo de entidad
 * @module file-browser-new/components/tcg-cards
 */

import type { CSSProperties } from 'react';
import { memo } from 'react';
import type { BrowserItem, EntityTypeMapping } from '../../types/item.types';
import { TCG3DCard } from './tcg-3d-card';
import { TCGAudioCard } from './tcg-audio-card';
import { TCGDocumentCard } from './tcg-document-card';
import { TCGFolderCard } from './tcg-folder-card';
import { TCGImageCard } from './tcg-image-card';
import { TCGJsonCard } from './tcg-json-card';
import { TCGVideoCard } from './tcg-video-card';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGCardProps {
	item: BrowserItem;
	/** Ancho de la tarjeta */
	width: number;
	/** Alto opcional */
	height?: number;
	/** Variante de vista */
	variant: 'grid' | 'card' | 'masonry' | 'list';
	/** Seleccionada */
	isSelected?: boolean;
	/** Activa (folder abierto, etc) */
	isActive?: boolean;
	/** Animación de entrada */
	animateIn?: boolean;
	/** Orden para animación escalonada */
	layoutOrder?: number;
	/** Handlers */
	onClick?: (e: React.MouseEvent) => void;
	onDoubleClick?: () => void;
	onContextMenu?: (e: React.MouseEvent) => void;
	/** Estilos adicionales */
	className?: string;
	style?: CSSProperties;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const TCGCard = memo(function TCGCard({ item, ...props }: TCGCardProps) {
	// Renderizar card específica según entityType
	switch (item.entityType) {
		case 'image':
			return <TCGImageCard item={item as EntityTypeMapping['image']} {...props} />;

		case 'video':
			return <TCGVideoCard item={item as EntityTypeMapping['video']} {...props} />;

		case 'audio':
			return <TCGAudioCard item={item as EntityTypeMapping['audio']} {...props} />;

		case 'document':
			return <TCGDocumentCard item={item as EntityTypeMapping['document']} {...props} />;

		case 'jsonFile':
			return <TCGJsonCard item={item as EntityTypeMapping['jsonFile']} {...props} />;

		case 'file3d':
			return <TCG3DCard item={item as EntityTypeMapping['file3d']} {...props} />;

		case 'folder':
			return <TCGFolderCard item={item as EntityTypeMapping['folder']} {...props} />;

		default:
			// Fallback: renderizar como imagen (más común)
			console.warn(`TCGCard: Unknown entity type "${item.entityType}"`);
			return <TCGImageCard item={item as EntityTypeMapping['image']} {...props} />;
	}
});

export { TCG3DCard } from './tcg-3d-card';
export { TCGAudioCard } from './tcg-audio-card';
export type { TCGCardBaseProps } from './tcg-card-base';
// Re-exports
export { TCGCardBase } from './tcg-card-base';
export { TCGDocumentCard } from './tcg-document-card';
export { TCGFolderCard } from './tcg-folder-card';
export { TCGImageCard } from './tcg-image-card';
export { TCGJsonCard } from './tcg-json-card';
export { TCGVideoCard } from './tcg-video-card';
