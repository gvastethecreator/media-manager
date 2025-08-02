/**
 * @file Hook para gestión de configuración de ListView
 * @description Proporciona funciones para gestionar la configuración de columnas y vista
 */

import React from 'react';
import { useMemo, useCallback } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ListColumnConfig, ListViewConfig } from '@/types/file-browser/list-column-config';
import {
	DEFAULT_LIST_VIEW_CONFIG,
	getColumnsForEntityType,
	formatFileSize,
	formatDuration,
	formatDate
} from '@/types/file-browser/list-column-config';

/**
 * Hook para gestionar la configuración de ListView
 */
export function useListViewConfig() {
	const settings = useSettingsStore(state => state.settings);
	const updateSettings = useSettingsStore(state => state.updateSettings);

	// Configuración actual del ListView
	const listViewConfig = useMemo(() => {
		const config = settings?.fileViews?.listView;
		if (!config) {
			return DEFAULT_LIST_VIEW_CONFIG;
		}

		// Merge con configuración por defecto
		return {
			...DEFAULT_LIST_VIEW_CONFIG,
			...config,
		} as ListViewConfig;
	}, [settings?.fileViews?.listView]);

	// Actualizar configuración de ListView
	const updateListViewConfig = useCallback(async (updates: Partial<ListViewConfig>) => {
		await updateSettings({
			fileViews: {
				listView: {
					...listViewConfig,
					...updates,
				},
			},
		});
	}, [listViewConfig, updateSettings]);

	// Actualizar configuración de columnas
	const updateColumnConfig = useCallback(async (columnKey: string, updates: Partial<ListColumnConfig>) => {
		const updatedColumns = listViewConfig.columns.map(col =>
			col.key === columnKey ? { ...col, ...updates } : col
		);

		await updateListViewConfig({ columns: updatedColumns });
	}, [listViewConfig.columns, updateListViewConfig]);

	// Reordenar columnas
	const reorderColumns = useCallback(async (fromIndex: number, toIndex: number) => {
		const columns = [...listViewConfig.columns];
		const [movedColumn] = columns.splice(fromIndex, 1);
		columns.splice(toIndex, 0, movedColumn);

		// Actualizar órdenes
		const reorderedColumns = columns.map((col, index) => ({
			...col,
			order: index,
		}));

		await updateListViewConfig({ columns: reorderedColumns });
	}, [listViewConfig.columns, updateListViewConfig]);

	// Mostrar/ocultar columna
	const toggleColumnVisibility = useCallback(async (columnKey: string) => {
		await updateColumnConfig(columnKey, {
			visible: !listViewConfig.columns.find(col => col.key === columnKey)?.visible,
		});
	}, [listViewConfig.columns, updateColumnConfig]);

	// Redimensionar columna
	const resizeColumn = useCallback(async (columnKey: string, width: number | 'auto') => {
		await updateColumnConfig(columnKey, { width });
	}, [updateColumnConfig]);

	// Restablecer configuración a valores por defecto
	const resetToDefault = useCallback(async (entityType = 'default') => {
		const defaultColumns = getColumnsForEntityType(entityType);
		await updateListViewConfig({
			...DEFAULT_LIST_VIEW_CONFIG,
			columns: defaultColumns,
		});
	}, [updateListViewConfig]);

	// Obtener configuración de columnas con renderers
	const getColumnsWithRenderers = useCallback((entityType = 'default'): ListColumnConfig[] => {
		const baseColumns = listViewConfig.columns.length > 0
			? listViewConfig.columns
			: getColumnsForEntityType(entityType);

		return baseColumns.map(col => ({
			...col,
			renderer: getColumnRenderer(col.key),
		}));
	}, [listViewConfig.columns]);

	// Columnas visibles ordenadas
	const visibleColumns = useMemo(() => {
		return listViewConfig.columns
			.filter(col => col.visible)
			.sort((a, b) => (a.order || 0) - (b.order || 0));
	}, [listViewConfig.columns]);

	return {
		// Configuración actual
		config: listViewConfig,
		visibleColumns,

		// Funciones de actualización
		updateConfig: updateListViewConfig,
		updateColumn: updateColumnConfig,
		reorderColumns,
		toggleColumnVisibility,
		resizeColumn,
		resetToDefault,

		// Utilidades
		getColumnsWithRenderers,
		getColumnsForEntityType,
	};
}

/**
 * Obtiene el renderer apropiado para una columna específica
 */
function getColumnRenderer(columnKey: string) {
	const renderers: Record<string, (item: AnyEntityWithStats) => React.ReactNode> = {
		name: (item) => React.createElement(
			'div',
			{ className: 'flex items-center gap-2 min-w-0' },
			React.createElement('span', { className: 'truncate font-medium' }, item.name)
		),

		size: (item) => React.createElement(
			'span',
			{ className: 'text-sm text-muted-foreground' },
			formatFileSize(item.stats?.size || 0)
		),

		dateModified: (item) => React.createElement(
			'span',
			{ className: 'text-sm text-muted-foreground' },
			item.stats?.mtime ? formatDate(new Date(item.stats.mtime)) : '—'
		),

		dateCreated: (item) => React.createElement(
			'span',
			{ className: 'text-sm text-muted-foreground' },
			item.stats?.birthtime ? formatDate(new Date(item.stats.birthtime)) : '—'
		),

		type: (item) => React.createElement(
			'span',
			{ className: 'text-xs uppercase tracking-wide text-muted-foreground' },
			item.stats?.type || item.entityType || 'unknown'
		),

		dimensions: (item) => {
			// Para imágenes y videos
			const dimensions = (item as any).dimensions;
			if (dimensions?.width && dimensions?.height) {
				return React.createElement(
					'span',
					{ className: 'text-sm text-muted-foreground' },
					`${dimensions.width} × ${dimensions.height}`
				);
			}
			return React.createElement('span', { className: 'text-muted-foreground' }, '—');
		},

		duration: (item) => {
			// Para videos y audio
			const duration = (item as any).duration;
			if (typeof duration === 'number') {
				return React.createElement(
					'span',
					{ className: 'text-sm text-muted-foreground' },
					formatDuration(duration)
				);
			}
			return React.createElement('span', { className: 'text-muted-foreground' }, '—');
		},

		tags: (item) => {
			const tags = (item as any).tags || [];
			if (tags.length === 0) {
				return React.createElement('span', { className: 'text-muted-foreground' }, '—');
			}

			const tagElements = tags.slice(0, 3).map((tag: string, index: number) =>
				React.createElement(
					'span',
					{
						key: index,
						className: 'inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary text-secondary-foreground'
					},
					tag
				)
			);

			if (tags.length > 3) {
				tagElements.push(
					React.createElement(
						'span',
						{ key: 'more', className: 'text-xs text-muted-foreground' },
						`+${tags.length - 3}`
					)
				);
			}

			return React.createElement(
				'div',
				{ className: 'flex flex-wrap gap-1 max-w-full' },
				...tagElements
			);
		},

		// Renderers específicos para diferentes tipos de archivos
		artist: (item) => React.createElement(
			'span',
			{ className: 'text-sm text-muted-foreground' },
			(item as any).metadata?.artist || '—'
		),

		album: (item) => React.createElement(
			'span',
			{ className: 'text-sm text-muted-foreground' },
			(item as any).metadata?.album || '—'
		),

		bitrate: (item) => {
			const bitrate = (item as any).metadata?.bitrate;
			if (bitrate) {
				return React.createElement(
					'span',
					{ className: 'text-sm text-muted-foreground' },
					`${Math.round(bitrate / 1000)}k`
				);
			}
			return React.createElement('span', { className: 'text-muted-foreground' }, '—');
		},

		codec: (item) => React.createElement(
			'span',
			{ className: 'text-xs uppercase tracking-wide text-muted-foreground' },
			(item as any).metadata?.codec || '—'
		),

		pages: (item) => {
			const pages = (item as any).metadata?.pages;
			if (typeof pages === 'number') {
				return React.createElement(
					'span',
					{ className: 'text-sm text-muted-foreground' },
					pages.toString()
				);
			}
			return React.createElement('span', { className: 'text-muted-foreground' }, '—');
		},
	};

	return renderers[columnKey];
}
