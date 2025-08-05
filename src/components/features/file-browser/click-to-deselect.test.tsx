/**
 * @file Test for click-to-deselect functionality in FileBrowser
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { AnyEntityWithStats } from '@/types/migration';
import { EntityStatsType } from '@/types/migration';
import { FileBrowser } from './file-browser';

// Mock the stores and dependencies
mock.module('@/store/ui/selection.slice');
mock.module('@/store/ui/view-options.slice');
mock.module('@/store/ui/file-viewer.slice');
mock.module('@/store/details-panel.store');
mock.module('@/store/entities/image');
mock.module('@/lib/keyboard');
mock.module('@/lib/ui/toast');

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
		mock.doMock('@/store/ui/view-options.slice', () => ({
			useViewOptionsStore: mock.fn(() => ({
				viewMode: 'cards',
				itemSize: 200,
				searchQuery: '',
				sortOptions: [],
			})),
		}));

		mock.doMock('@/store/entities/image', () => ({
			useImageStore: mock.fn(() => ({
				images: {},
				isLoading: false,
				error: null,
				loadImages: mock(),
				getSortedImages: () => mockItems,
				getImagesByFolder: () => mockItems,
			})),
		}));

		mock.doMock('@/lib/keyboard', () => ({
			useFileBrowserShortcuts: () => ({
				register: mock(),
				setContext: mock(),
			}),
		}));
	});

	it('should call clearSelection when clicking on empty space in main container', () => {
		render(<FileBrowser entityType={EntityStatsType.IMAGE} mode="manual" items={mockItems} />);

		const container = screen.getByTestId('file-browser-container');

		// Simulate click on empty space (the container itself)
		fireEvent.click(container);

		expect(mockClearSelection).toHaveBeenCalled();
	});

	it('should not call clearSelection when clicking on an item', () => {
		render(<FileBrowser entityType={EntityStatsType.IMAGE} mode="manual" items={mockItems} />);

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

		viewModes.forEach((viewMode) => {
			mock.restore();

			// Mock the view mode
			mock.doMock('@/store/ui/view-options.slice', () => ({
				useViewOptionsStore: mock.fn(() => ({
					viewMode,
					itemSize: 200,
					searchQuery: '',
					sortOptions: [],
				})),
			}));

			render(<FileBrowser entityType={EntityStatsType.IMAGE} mode="manual" items={mockItems} />);

			const container = screen.getByTestId('file-browser-container');
			fireEvent.click(container);

			expect(mockClearSelection).toHaveBeenCalled();
		});
	});
});
