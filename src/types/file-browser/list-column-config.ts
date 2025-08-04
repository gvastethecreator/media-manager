/**
 * @file List Column Configuration Types
 * @description Configuración de columnas para ListView en FileBrowser
 */

import type { ListColumnConfig as BaseListColumnConfig, ListViewConfig } from '@/transformers/settings/schema';
import type { AnyEntityWithStats } from '@/types/entities';

// Re-exportamos el tipo de configuración de ListView
export type { ListViewConfig };

/**
 * Configuración extendida de columna con renderer personalizado
 */
export interface ListColumnConfig extends BaseListColumnConfig {
	/** Función de renderizado personalizada para el contenido de la celda */
	renderer?: (item: AnyEntityWithStats) => React.ReactNode;
}

/**
 * Configuraciones predefinidas de columnas para diferentes tipos de entidades
 */
export const DEFAULT_COLUMNS: Record<string, ListColumnConfig[]> = {
	image: [
		{
			key: 'thumbnail',
			label: '',
			width: 60,
			sortable: false,
			visible: true,
			align: 'center',
			resizable: false,
			minWidth: 40,
			maxWidth: 80,
			order: 0,
		},
		{
			key: 'name',
			label: 'Nombre',
			width: 'auto',
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 150,
			order: 1,
		},
		{
			key: 'dimensions',
			label: 'Dimensiones',
			width: 120,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 100,
			maxWidth: 150,
			order: 2,
		},
		{
			key: 'size',
			label: 'Tamaño',
			width: 100,
			sortable: true,
			visible: true,
			align: 'right',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 3,
		},
		{
			key: 'dateModified',
			label: 'Modificado',
			width: 140,
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 120,
			maxWidth: 180,
			order: 4,
		},
		{
			key: 'dateCreated',
			label: 'Creado',
			width: 140,
			sortable: false,
			visible: false,
			align: 'left',
			resizable: true,
			minWidth: 120,
			maxWidth: 180,
			order: 5,
		},
		{
			key: 'type',
			label: 'Tipo',
			width: 80,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 60,
			maxWidth: 100,
			order: 6,
		},
		{
			key: 'tags',
			label: 'Etiquetas',
			width: 150,
			sortable: false,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 100,
			maxWidth: 250,
			order: 7,
		},
	],
	video: [
		{
			key: 'thumbnail',
			label: '',
			width: 60,
			sortable: false,
			visible: true,
			align: 'center',
			resizable: false,
			minWidth: 40,
			maxWidth: 80,
			order: 0,
		},
		{
			key: 'name',
			label: 'Nombre',
			width: 'auto',
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 150,
			order: 1,
		},
		{
			key: 'duration',
			label: 'Duración',
			width: 100,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 2,
		},
		{
			key: 'dimensions',
			label: 'Resolución',
			width: 120,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 100,
			maxWidth: 150,
			order: 3,
		},
		{
			key: 'size',
			label: 'Tamaño',
			width: 100,
			sortable: true,
			visible: true,
			align: 'right',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 4,
		},
		{
			key: 'codec',
			label: 'Codec',
			width: 100,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 5,
		},
		{
			key: 'dateModified',
			label: 'Modificado',
			width: 140,
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 120,
			maxWidth: 180,
			order: 6,
		},
	],
	audio: [
		{
			key: 'thumbnail',
			label: '',
			width: 60,
			sortable: false,
			visible: true,
			align: 'center',
			resizable: false,
			minWidth: 40,
			maxWidth: 80,
			order: 0,
		},
		{
			key: 'name',
			label: 'Nombre',
			width: 'auto',
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 150,
			order: 1,
		},
		{
			key: 'duration',
			label: 'Duración',
			width: 100,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 2,
		},
		{
			key: 'artist',
			label: 'Artista',
			width: 150,
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 100,
			maxWidth: 200,
			order: 3,
		},
		{
			key: 'album',
			label: 'Álbum',
			width: 150,
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 100,
			maxWidth: 200,
			order: 4,
		},
		{
			key: 'bitrate',
			label: 'Bitrate',
			width: 80,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 60,
			maxWidth: 100,
			order: 5,
		},
		{
			key: 'size',
			label: 'Tamaño',
			width: 100,
			sortable: true,
			visible: true,
			align: 'right',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 6,
		},
	],
	document: [
		{
			key: 'thumbnail',
			label: '',
			width: 60,
			sortable: false,
			visible: true,
			align: 'center',
			resizable: false,
			minWidth: 40,
			maxWidth: 80,
			order: 0,
		},
		{
			key: 'name',
			label: 'Nombre',
			width: 'auto',
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 150,
			order: 1,
		},
		{
			key: 'type',
			label: 'Tipo',
			width: 80,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 60,
			maxWidth: 100,
			order: 2,
		},
		{
			key: 'pages',
			label: 'Páginas',
			width: 80,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 60,
			maxWidth: 100,
			order: 3,
		},
		{
			key: 'size',
			label: 'Tamaño',
			width: 100,
			sortable: true,
			visible: true,
			align: 'right',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 4,
		},
		{
			key: 'dateModified',
			label: 'Modificado',
			width: 140,
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 120,
			maxWidth: 180,
			order: 5,
		},
	],
	// Configuración genérica para otros tipos
	default: [
		{
			key: 'thumbnail',
			label: '',
			width: 60,
			sortable: false,
			visible: true,
			align: 'center',
			resizable: false,
			minWidth: 40,
			maxWidth: 80,
			order: 0,
		},
		{
			key: 'name',
			label: 'Nombre',
			width: 'auto',
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 150,
			order: 1,
		},
		{
			key: 'type',
			label: 'Tipo',
			width: 100,
			sortable: true,
			visible: true,
			align: 'center',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 2,
		},
		{
			key: 'size',
			label: 'Tamaño',
			width: 100,
			sortable: true,
			visible: true,
			align: 'right',
			resizable: true,
			minWidth: 80,
			maxWidth: 120,
			order: 3,
		},
		{
			key: 'dateModified',
			label: 'Modificado',
			width: 140,
			sortable: true,
			visible: true,
			align: 'left',
			resizable: true,
			minWidth: 120,
			maxWidth: 180,
			order: 4,
		},
	],
};

/**
 * Configuración por defecto del ListView
 */
export const DEFAULT_LIST_VIEW_CONFIG: ListViewConfig = {
	columns: DEFAULT_COLUMNS.default,
	rowHeight: 72,
	showZebraStripes: true,
	showHeader: true,
	allowResize: true,
	allowReorder: true,
	showThumbnails: true,
	thumbnailSize: 'medium',
	rowGap: 2,
	cellPadding: 12,
};

/**
 * Helper function para obtener columnas por tipo de entidad
 */
export function getColumnsForEntityType(entityType: string): ListColumnConfig[] {
	return DEFAULT_COLUMNS[entityType] || DEFAULT_COLUMNS.default;
}

/**
 * Helper function para formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Helper function para formatear duración
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Helper function para formatear fecha
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}
