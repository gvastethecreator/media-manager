/**
 * @file Tipos para MediaThumbnail
 * @module file-browser-new/components/media-thumbnail/types
 */

import type React from 'react';
import type { ThumbnailQuality } from '@/lib/config/thumbnail.config';

/**
 * Tipo unificado utilizado por las vistas del FileBrowser
 */
export interface MediaItem {
	id: string;
	name: string;
	entityType: 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d' | 'folder';
	mimeType?: string | null;
	thumbnailUrl?: string | null;
	// Metacampos opcionales utilizados por distintas vistas/columnas
	createdAt?: number | string | Date;
	size?: number;
	path?: string;
	width?: number;
	height?: number;
	// Campos específicos para folders
	parentId?: string | null;
	totalItems?: number;
	emoji?: string | null;
	color?: string | null;
}

export interface MediaThumbnailProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	item: MediaItem;
	quality?: ThumbnailQuality;
	animateVideoOnHover?: boolean;
	videoFramesCount?: number;
	videoCycleDurationMs?: number;
	/**
	 * Margen de precarga para el IntersectionObserver (rootMargin),
	 * permite iniciar generación/carga de thumbnails antes de entrar a viewport.
	 */
	preloadMargin?: string;
	/**
	 * Bloquea el tamaño inicial usando aspect-ratio para evitar rebotes
	 * al cargar la imagen.
	 */
	lockAspectRatio?: boolean;
	/**
	 * Relación de aspecto prevista (ancho/alto) cuando el item no tiene width/height.
	 */
	predictedAspectRatio?: number;
}
