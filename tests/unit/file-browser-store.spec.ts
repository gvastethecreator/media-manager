import { describe, expect, it } from 'vitest';
import { useFileBrowserStore } from '@/stores/file-browser-store';

describe('FileBrowser Store', () => {
	it('estado inicial correcto', () => {
		const state = useFileBrowserStore.getState();
		expect(state.currentViewType).toBe('grid');
		expect(state.sortBy).toBe('name');
		expect(state.sortDirection).toBe('asc');
		expect(state.showHiddenFiles).toBe(false);
		expect(state.enableAnimations).toBe(true);
	});

	it('actualiza viewType y configuración', () => {
		const { setViewType, updateViewConfiguration } = useFileBrowserStore.getState();
		setViewType('list');
		const conf = { columnWidth: 240, gap: 8 } as any; // tipo de ViewConfiguration del proyecto
		updateViewConfiguration('list', conf);

		const state = useFileBrowserStore.getState();
		expect(state.currentViewType).toBe('list');
		expect(state.viewConfigurations.list).toEqual(conf);
	});

	it('cambia sort y alterna dirección', () => {
		const { setSortBy, setSortDirection, toggleSortDirection } = useFileBrowserStore.getState();
		setSortBy('updatedAt');
		setSortDirection('desc');
		expect(useFileBrowserStore.getState().sortBy).toBe('updatedAt');
		expect(useFileBrowserStore.getState().sortDirection).toBe('desc');

		toggleSortDirection();
		expect(useFileBrowserStore.getState().sortDirection).toBe('asc');
	});

	it('flags de UI', () => {
		const { setShowHiddenFiles, setEnableAnimations } = useFileBrowserStore.getState();
		setShowHiddenFiles(true);
		setEnableAnimations(false);
		const state = useFileBrowserStore.getState();
		expect(state.showHiddenFiles).toBe(true);
		expect(state.enableAnimations).toBe(false);
	});
});
