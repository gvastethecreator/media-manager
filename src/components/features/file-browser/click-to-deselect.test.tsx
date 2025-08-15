/**
 * @file Test for click-to-deselect functionality in FileBrowser
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, render } from '@/test/test-utils';
import type { AnyEntityWithStats } from '@/types/migration';
import { EntityStatsType } from '@/types/migration';
let FileBrowserCmp: any;

// Mock the stores and dependencies
mock.module('@/store/selection.store', () => ({ useSelectionStore: mock() }));
mock.module('@/store/ui/view-options.slice', () => ({ useViewOptionsStore: mock() }));
mock.module('@/store/ui/file-viewer.slice', () => ({ useFileViewerStore: mock() }));
mock.module('@/store/entities/settings/store', () => ({ useInterfaceSettingsStore: mock() }));
mock.module('@/store/details-panel.store', () => ({ useDetailsPanel: mock() }));
mock.module('@/store/entities/image', () => ({ useImageStore: mock() }));
mock.module('@/lib/keyboard', () => ({ useFileBrowserShortcuts: mock() }));
mock.module('@/lib/ui/toast', () => ({
	toastService: {
		success: mock(() => {
			/* noop */
		}),
		error: mock(() => {
			/* noop */
		}),
		info: mock(() => {
			/* noop */
		}),
	},
}));

// Mock data
const mockItems: AnyEntityWithStats[] = [
	{
		id: '1',
		entityType: 'image' as const,
		name: 'Test Image 1',
		path: '/test/image1.jpg',
	},
	{
		id: '2',
		entityType: 'image' as const,
		name: 'Test Image 2',
		path: '/test/image2.jpg',
	},
] as AnyEntityWithStats[];

describe('FileBrowser Click-to-Deselect', () => {
	const mockClearSelection = mock();
	const mockSetSelectedIds = mock();

		beforeEach(async () => {
			// Resetear contadores de mocks compartidos entre tests
			mockClearSelection.mockReset();
			mockSetSelectedIds.mockReset();
		mock.restore();

			// Mock useSelectionStore compatible con selectores de Zustand
			mock.module('@/store/selection.store', () => {
				const baseState = {
					selectedIds: ['1'],
					focusedId: null,
					clearSelection: mockClearSelection,
					setSelectedIds: mockSetSelectedIds,
					selectAll: mock(),
					toggleSelection: mock(),
					setFocusedId: mock(),
				};
				return {
					useSelectionStore: mock((selector?: any) => (typeof selector === 'function' ? selector(baseState) : baseState)),
				};
			});

		// Mock other stores
			mock.module('@/store/ui/view-options.slice', () => {
				const baseState = {
					viewMode: 'cards',
					itemSize: 200,
					searchQuery: '',
					sortOptions: [] as any[],
					addSortOption: mock(),
				};
				return {
					useViewOptionsStore: mock((selector?: any) => (typeof selector === 'function' ? selector(baseState) : baseState)),
				};
			});

			// Mock interface settings store usado por FileBrowser
			mock.module('@/store/entities/settings/store', () => {
				const prefs = {
					animations: false,
					thumbnailsAnimations: false,
					thumbnailsUltraPerformance: true,
					thumbnailsRespectAspectRatio: true,
					thumbnailsBorderRadius: 4,
					fileBrowser: {
						general: { enableViewTransitions: false, enableProgressiveLoading: false, itemsPerBatch: 50 },
						performance: { enableVirtualization: false, overscanCount: 3, thumbnailQuality: 'high' },
						views: {},
					},
				};
				return {
					useInterfaceSettingsStore: mock((selector?: any) => (typeof selector === 'function' ? selector({ preferences: prefs }) : { preferences: prefs })),
				};
			});

			// Mock details panel store para evitar desestructuración de undefined
			mock.module('@/store/details-panel.store', () => {
				const baseState = {
					isVisible: true,
					isFixed: false,
					showStatsWhenEmpty: true,
					selectedItems: [],
					showInterfaceSettings: false,
					setVisible: mock(),
					setSelectedItems: mock(),
					toggleVisibility: mock(),
					toggleFixed: mock(),
					toggleShowStatsWhenEmpty: mock(),
					toggleInterfaceSettings: mock(),
					setFixed: mock(),
					setShowStatsWhenEmpty: mock(),
					setShowInterfaceSettings: mock(),
				};
				return {
					useDetailsPanel: mock((selector?: any) => (typeof selector === 'function' ? selector(baseState) : baseState)),
				};
			});

			// Mock file viewer store mínimo
			mock.module('@/store/ui/file-viewer.slice', () => {
				const baseState = { open: false, openWith: mock(), preview: mock(), close: mock() };
				return {
					useFileViewerStore: mock((selector?: any) => (typeof selector === 'function' ? selector(baseState) : baseState)),
				};
			});

		mock.module('@/store/entities/image', () => ({
			useImageStore: mock(() => ({
				images: {},
				isLoading: false,
				error: null,
				loadImages: mock(),
				getSortedImages: () => mockItems,
				getImagesByFolder: () => mockItems,
			})),
		}));

		mock.module('@/lib/keyboard', () => ({
			useFileBrowserShortcuts: () => ({
				register: mock(),
				setContext: mock(),
			}),
		}));

		// Importar el componente después de registrar todos los mocks
		FileBrowserCmp = (await import('./file-browser')).FileBrowser;
	});

	it('should call clearSelection when clicking on empty space in main container', () => {
		const { getByTestId } = render(<FileBrowserCmp entityType={EntityStatsType.IMAGE} items={mockItems} mode="manual" />);

		const container = getByTestId('file-browser-container');

		// Simulate click on empty space (the container itself)
		fireEvent.click(container);

		expect(mockClearSelection).toHaveBeenCalled();
	});

	it('should not call clearSelection when clicking on an item', () => {
		const { container } = render(<FileBrowserCmp entityType={EntityStatsType.IMAGE} items={mockItems} mode="manual" />);

		// Seleccionar un card real por atributo data-item-id
		const firstCard = container.querySelector('[data-item-id]') as HTMLElement | null;
		if (firstCard) {
			fireEvent.click(firstCard);

			// clearSelection should not be called when clicking on items
			expect(mockClearSelection).not.toHaveBeenCalled();
		}
	});

	it('should work across different view modes', () => {
		const viewModes = ['list', 'grid', 'cards', 'masonry'];

		for (const viewMode of viewModes) {
			// Re-mock only the view options slice without restoring everything
			mock.module('@/store/ui/view-options.slice', () => {
				const baseState = {
					viewMode,
					itemSize: 200,
					searchQuery: '',
					sortOptions: [] as any[],
					addSortOption: mock(),
				};
				return {
					useViewOptionsStore: mock((selector?: any) => (typeof selector === 'function' ? selector(baseState) : baseState)),
				};
			});

	const { getByTestId, unmount } = render(<FileBrowserCmp entityType={EntityStatsType.IMAGE} items={mockItems} mode="manual" />);

			const container = getByTestId('file-browser-container');
			fireEvent.click(container);

		expect(mockClearSelection).toHaveBeenCalled();
		unmount();
		}
	});
});
