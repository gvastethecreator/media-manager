/**
 * @file Tipos para items del explorador de archivos
 * @module types/file-browser/file-item
 * @description Define la interfaz FileItem para el explorador de archivos
 */

import { formatFileSize } from '@/lib/utils/format.utils';
import type { AnyEntityWithStats } from '@/types/entities';

/**
 * Interfaz base para items del explorador de archivos
 */
export interface FileItem {
	/** File creation time */
	birthtime?: Date;
	/** Extensión del archivo */
	extension: string;
	/** ID único del item */
	id: string;
	/** Si es un directorio */
	isDirectory: boolean;
	/** Si está marcado como favorito */
	isFavorite?: boolean;
	/** Whether this is a file */
	isFile?: boolean;

	/** Metadatos adicionales */
	metadata?: {
		/** Tamaño del archivo formateado */
		fileSize?: string;
		/** Título alternativo */
		title?: string;
		/** Descripción */
		description?: string;
		/** Ancho (para imágenes/videos) */
		width?: number;
		/** Alto (para imágenes/videos) */
		height?: number;
		/** Duración (para videos/audio) */
		duration?: number;
		/** Propiedades adicionales */
		[key: string]: any;
	};
	/** Tipo MIME */
	mimeType: string;
	/** Fecha de modificación */
	modifiedAt: Date;

	// File system properties added for compatibility with entity statistics
	/** Last modification time (alias for modifiedAt) */
	mtime?: Date;
	/** Nombre del item */
	name: string;
	/** Ruta del item */
	path: string;
	/** Tamaño en bytes */
	size: number;
	/** URL del thumbnail */
	thumbnailUrl?: string;
	/** Tipo de item */
	type: 'file' | 'directory';
}

/**
 * Función helper para convertir AnyEntityWithStats a FileItem
 */
export function entityToFileItem(entity: AnyEntityWithStats): FileItem {
	const modifiedAt =
		'updatedAt' in entity ? entity.updatedAt : 'modifiedAt' in entity ? (entity as any).modifiedAt : new Date();

	return {
		id: entity.id,
		name: 'name' in entity ? entity.name : 'title' in entity ? (entity as any).title : 'Unknown',
		type: 'file' as const,
		size: 'size' in entity ? (entity as any).size : 0,
		modifiedAt,
		path: 'path' in entity ? (entity as any).path : '',
		isDirectory: false,
		extension: 'extension' in entity ? (entity as any).extension : '',
		mimeType: 'mimeType' in entity ? (entity as any).mimeType : 'application/octet-stream',
		thumbnailUrl: 'thumbnailUrl' in entity ? (entity as any).thumbnailUrl : undefined,
		isFavorite: 'isFavorite' in entity ? (entity as any).isFavorite : false,

		// File system properties for compatibility
		mtime: modifiedAt,
		birthtime: 'createdAt' in entity ? entity.createdAt : modifiedAt,
		isFile: true,

		metadata: {
			fileSize: 'size' in entity ? formatFileSize((entity as any).size) : '0 B',
			title: 'title' in entity ? (entity as any).title : undefined,
			description: 'description' in entity ? entity.description || undefined : undefined,
			width: 'width' in entity ? (entity as any).width : undefined,
			height: 'height' in entity ? (entity as any).height : undefined,
			duration: 'duration' in entity ? (entity as any).duration : undefined,
		},
	};
}

// formatFileSize importada desde @/lib/utils/format.utils
