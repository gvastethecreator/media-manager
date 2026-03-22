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
	color?: string | null;
	// Metacampos opcionales utilizados por distintas vistas/columnas
	createdAt?: number | string | Date;
	emoji?: string | null;
	entityType: 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d' | 'folder';
	height?: number;
	id: string;
	mimeType?: string | null;
	name: string;
	// Campos específicos para folders
	parentId?: string | null;
	path?: string;
	size?: number;
	thumbnailUrl?: string | null;
	totalItems?: number;
	width?: number;
}

export interface MediaThumbnailProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	animateVideoOnHover?: boolean;
	item: MediaItem;
	/**
	 * Bloquea el tamaño inicial usando aspect-ratio para evitar rebotes
	 * al cargar la imagen.
	 */
	lockAspectRatio?: boolean;
	/**
	 * Relación de aspecto prevista (ancho/alto) cuando el item no tiene width/height.
	 */
	predictedAspectRatio?: number;
	/**
	 * Margen de precarga para el IntersectionObserver (rootMargin),
	 * permite iniciar generación/carga de thumbnails antes de entrar a viewport.
	 */
	preloadMargin?: string;
	quality?: ThumbnailQuality;
	videoCycleDurationMs?: number;
	videoFramesCount?: number;
}
