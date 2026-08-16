/**
 * @file Tests for the ListView configuration hook.
 * @description Verifies the behavior exposed by useListViewConfig.
 */

import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useListViewConfig } from '@/hooks/use-list-view-config';

const mockListViewConfig = {
	columns: [
		{
			key: 'name',
			label: 'Name',
			width: 'auto',
			visible: true,
			sortable: true,
			order: 0,
		},
		{
			key: 'size',
			label: 'Size',
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
};

// Mock dependencies with Zustand's selector pattern.
vi.mock('@/store/settings.store', () => ({
	useSettingsStore: vi.fn((selector?: (state: any) => any) => {
		const state = {
			settings: {
				fileViews: {
					listView: mockListViewConfig,
				},
			},
			updateSettings: vi.fn(),
		};
		return selector ? selector(state) : state;
	}),
}));

describe('useListViewConfig', () => {
	it('returns the default configuration when no saved configuration exists', () => {
		const { result } = renderHook(() => useListViewConfig());

		expect(result.current.config).toBeDefined();
		expect(result.current.config.rowHeight).toBe(72);
		expect(result.current.config.showHeader).toBe(true);
		expect(result.current.visibleColumns).toBeDefined();
	});

	it('provides update functions', () => {
		const { result } = renderHook(() => useListViewConfig());

		expect(typeof result.current.updateConfig).toBe('function');
		expect(typeof result.current.updateColumn).toBe('function');
		expect(typeof result.current.reorderColumns).toBe('function');
		expect(typeof result.current.toggleColumnVisibility).toBe('function');
		expect(typeof result.current.resizeColumn).toBe('function');
		expect(typeof result.current.resetToDefault).toBe('function');
	});

	it('filters and sorts visible columns', () => {
		const { result } = renderHook(() => useListViewConfig());

		const visibleColumns = result.current.visibleColumns;
		expect(visibleColumns).toHaveLength(2);
		expect(visibleColumns[0].key).toBe('name');
		expect(visibleColumns[1].key).toBe('size');
	});

	it('provides column utilities', () => {
		const { result } = renderHook(() => useListViewConfig());

		expect(typeof result.current.getColumnsWithRenderers).toBe('function');
		expect(typeof result.current.getColumnsForEntityType).toBe('function');
	});

	it('getColumnsWithRenderers returns columns with renderers', () => {
		const { result } = renderHook(() => useListViewConfig());

		const columnsWithRenderers = result.current.getColumnsWithRenderers('image');
		expect(columnsWithRenderers).toBeDefined();
		expect(Array.isArray(columnsWithRenderers)).toBe(true);
	});
});
