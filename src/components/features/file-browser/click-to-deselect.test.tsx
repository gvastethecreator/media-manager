/**
 * @file Test for click-to-deselect functionality in FileBrowser
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileBrowser } from './file-browser';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { AnyEntityWithStats } from '@/types/migration';
import { EntityStatsType } from '@/types/migration';

// Mock the stores and dependencies
vi.mock('@/store/ui/selection.slice');
vi.mock('@/store/ui/view-options.slice');
vi.mock('@/store/ui/file-viewer.slice');
vi.mock('@/store/details-panel.store');
vi.mock('@/store/entities/image');
vi.mock('@/lib/keyboard');
vi.mock('@/lib/ui/toast');

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
  const mockClearSelection = vi.fn();
  const mockSetSelectedIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useSelectionStore
    (useSelectionStore as any).mockReturnValue({
      selectedIds: ['1'],
      clearSelection: mockClearSelection,
      setSelectedIds: mockSetSelectedIds,
      selectAll: vi.fn(),
    });

    // Mock other stores
    vi.doMock('@/store/ui/view-options.slice', () => ({
      useViewOptionsStore: vi.fn(() => ({
        viewMode: 'cards',
        itemSize: 200,
        searchQuery: '',
        sortOptions: [],
      })),
    }));

    vi.doMock('@/store/entities/image', () => ({
      useImageStore: vi.fn(() => ({
        images: {},
        isLoading: false,
        error: null,
        loadImages: vi.fn(),
        getSortedImages: () => mockItems,
        getImagesByFolder: () => mockItems,
      })),
    }));

    vi.doMock('@/lib/keyboard', () => ({
      useFileBrowserShortcuts: () => ({
        register: vi.fn(),
        setContext: vi.fn(),
      }),
    }));
  });

  it('should call clearSelection when clicking on empty space in main container', () => {
    render(
      <FileBrowser
        entityType={EntityStatsType.IMAGE}
        mode="manual"
        items={mockItems}
      />
    );

    const container = screen.getByTestId('file-browser-container');

    // Simulate click on empty space (the container itself)
    fireEvent.click(container);

    expect(mockClearSelection).toHaveBeenCalled();
  });

  it('should not call clearSelection when clicking on an item', () => {
    render(
      <FileBrowser
        entityType={EntityStatsType.IMAGE}
        mode="manual"
        items={mockItems}
      />
    );

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
      vi.clearAllMocks();

      // Mock the view mode
      vi.doMock('@/store/ui/view-options.slice', () => ({
        useViewOptionsStore: vi.fn(() => ({
          viewMode,
          itemSize: 200,
          searchQuery: '',
          sortOptions: [],
        })),
      }));

      render(
          <FileBrowser
            entityType={EntityStatsType.IMAGE}
            mode="manual"
            items={mockItems}
          />
        );

      const container = screen.getByTestId('file-browser-container');
      fireEvent.click(container);

      expect(mockClearSelection).toHaveBeenCalled();
    });
  });
});