/**
 * @file Tests para hook de configuración de ListView
 * @description Tests para verificar la funcionalidad del hook useListViewConfig
 */

import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useListViewConfig } from '@/hooks/use-list-view-config';

// Mock de dependencias
vi.mock('@/store/settings.store', () => ({
	useSettingsStore: {
		use: {
			settings: () => ({
				fileViews: {
					listView: {
						columns: [
							{
								key: 'name',
								label: 'Nombre',
								width: 'auto',
								visible: true,
								sortable: true,
								order: 0,
							},
							{
								key: 'size',
								label: 'Tamaño',
								width: 100,
								visible: true,
								sortable: true,
								order: 1,
							},
						],
						rowHeight: 72,
						showZebraStripes: true,
						showHeader: true,
						allowResize: true,
						allowReorder: true,
						showThumbnails: true,
						thumbnailSize: 'none',
						rowGap: 2,
						cellPadding: 12,
					},
				},
			}),
			updateSettings: () => vi.fn(),
		},
	},
}));

describe('useListViewConfig', () => {
	it('retorna la configuración por defecto cuando no hay configuración guardada', () => {
		const { result } = renderHook(() => useListViewConfig());

		expect(result.current.config).toBeDefined();
		expect(result.current.config.rowHeight).toBe(72);
		expect(result.current.config.showHeader).toBe(true);
		expect(result.current.visibleColumns).toBeDefined();
	});

	it('proporciona funciones de actualización', () => {
		const { result } = renderHook(() => useListViewConfig());

		expect(typeof result.current.updateConfig).toBe('function');
		expect(typeof result.current.updateColumn).toBe('function');
		expect(typeof result.current.reorderColumns).toBe('function');
		expect(typeof result.current.toggleColumnVisibility).toBe('function');
		expect(typeof result.current.resizeColumn).toBe('function');
		expect(typeof result.current.resetToDefault).toBe('function');
	});

	it('filtra y ordena correctamente las columnas visibles', () => {
		const { result } = renderHook(() => useListViewConfig());

		const visibleColumns = result.current.visibleColumns;
		expect(visibleColumns).toHaveLength(2);
		expect(visibleColumns[0].key).toBe('name');
		expect(visibleColumns[1].key).toBe('size');
	});

	it('proporciona utilidades para columnas', () => {
		const { result } = renderHook(() => useListViewConfig());

		expect(typeof result.current.getColumnsWithRenderers).toBe('function');
		expect(typeof result.current.getColumnsForEntityType).toBe('function');
	});

	it('getColumnsWithRenderers retorna columnas con renderers', () => {
		const { result } = renderHook(() => useListViewConfig());

		const columnsWithRenderers = result.current.getColumnsWithRenderers('image');
		expect(columnsWithRenderers).toBeDefined();
		expect(Array.isArray(columnsWithRenderers)).toBe(true);
	});
});
