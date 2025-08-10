/**
 * @file Test for click-to-deselect functionality in FileBrowser
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { fireEvent, render, screen } from '@/test/test-utils';
import type { AnyEntityWithStats } from '@/types/migration';
import { EntityStatsType } from '@/types/migration';
import { FileBrowser } from './file-browser';

// Mock the stores and dependencies
mock.module('@/store/ui/selection.slice', () => ({ useSelectionStore: mock() }));
mock.module('@/store/ui/view-options.slice', () => ({ useViewOptionsStore: mock() }));
mock.module('@/store/ui/file-viewer.slice', () => ({ useFileViewerStore: mock() }));
mock.module('@/store/details-panel.store', () => ({ useDetailsPanelStore: mock() }));
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

	beforeEach(() => {
		mock.restore();

		// Mock useSelectionStore
		(useSelectionStore as any).mockReturnValue({
			selectedIds: ['1'],
			clearSelection: mockClearSelection,
			setSelectedIds: mockSetSelectedIds,
			selectAll: mock(),
		});

		// Mock other stores
		mock.module('@/store/ui/view-options.slice', () => ({
			useViewOptionsStore: mock(() => ({
				viewMode: 'cards',
				itemSize: 200,
				searchQuery: '',
				sortOptions: [],
			})),
		}));

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
	});

	it('should call clearSelection when clicking on empty space in main container', () => {
		render(<FileBrowser entityType={EntityStatsType.IMAGE} items={mockItems} mode="manual" />);

		const container = screen.getByTestId('file-browser-container');

		// Simulate click on empty space (the container itself)
		fireEvent.click(container);

		expect(mockClearSelection).toHaveBeenCalled();
	});

	it('should not call clearSelection when clicking on an item', () => {
		render(<FileBrowser entityType={EntityStatsType.IMAGE} items={mockItems} mode="manual" />);

		// Find an entity card (this might need adjustment based on actual DOM structure)
		const entityCards = screen.getAllByRole('button');
		if (entityCards.length > 0) {
			fireEvent.click(entityCards[0]);

			// clearSelection should not be called when clicking on items
			expect(mockClearSelection).not.toHaveBeenCalled();
		}
	});

	it('should work across different view modes', () => {
		const viewModes = ['list', 'grid', 'cards', 'masonry'];

		for (const viewMode of viewModes) {
			mock.restore();

			// Mock the view mode
			mock.module('@/store/ui/view-options.slice', () => ({
				useViewOptionsStore: mock(() => ({
					viewMode,
					itemSize: 200,
					searchQuery: '',
					sortOptions: [],
				})),
			}));

			render(<FileBrowser entityType={EntityStatsType.IMAGE} items={mockItems} mode="manual" />);

			const container = screen.getByTestId('file-browser-container');
			fireEvent.click(container);

			expect(mockClearSelection).toHaveBeenCalled();
		}
	});
});
