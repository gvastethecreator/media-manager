import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiSelectionContextMenu } from './multi-selection-context-menu';
import type { FileItem } from '@/types/files';

// Mock the stores
vi.mock('@/store/entities/album', () => ({
  useAlbumStore: vi.fn((selector) => {
    const mockState = { albums: {} };
    return selector ? selector(mockState) : mockState;
  }),
}));

vi.mock('@/store/entities/collection', () => ({
  useCollectionStore: vi.fn((selector) => {
    const mockState = { collections: {} };
    return selector ? selector(mockState) : mockState;
  }),
}));

vi.mock('@/store/entities/tag', () => ({
  useTagStore: vi.fn((selector) => {
    const mockState = { getTags: () => [] };
    return selector ? selector(mockState) : mockState;
  }),
}));

// Mock the toast service
vi.mock('@/lib/ui/toast', () => ({
  toastService: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the keyboard navigation hook
vi.mock('@/lib/keyboard', () => ({
  useContextMenuNavigation: vi.fn(() => ({
    selectedIndex: -1,
    getItemProps: vi.fn(() => ({})),
  })),
}));

describe('MultiSelectionContextMenu', () => {
  const mockSelectedItems: FileItem[] = [
    {
      id: '1',
      name: 'test-file-1.jpg',
      size: 1024,
      createdAt: new Date(),
      updatedAt: new Date(),
      entityType: 'image',
    },
    {
      id: '2',
      name: 'test-file-2.jpg',
      size: 2048,
      createdAt: new Date(),
      updatedAt: new Date(),
      entityType: 'image',
    },
  ];

  const mockOnAction = vi.fn();
  const mockPosition = { x: 100, y: 100 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct selection count', () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    expect(screen.getByText('2 elementos seleccionados')).toBeInTheDocument();
    expect(screen.getByText(/Tamaño total: 3,072 bytes/)).toBeInTheDocument();
  });

  it('displays all bulk operation actions', () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    expect(screen.getByText('Copiar 2 elementos')).toBeInTheDocument();
    expect(screen.getByText('Mover 2 elementos')).toBeInTheDocument();
    expect(screen.getByText('Descargar 2 elementos')).toBeInTheDocument();
    expect(screen.getByText('Eliminar 2 elementos')).toBeInTheDocument();
  });

  it('shows estimated time for operations', () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    // Check that estimated times are displayed (they should be ~1s, ~2s, ~4s, ~1s for the operations)
    expect(screen.getByText('~3s')).toBeInTheDocument(); // copy-multiple: 2 * 1.5s = 3s
    expect(screen.getByText('~2s')).toBeInTheDocument(); // move-multiple: 2 * 1.0s = 2s
    expect(screen.getByText('~4s')).toBeInTheDocument(); // download-multiple: 2 * 2.0s = 4s
    expect(screen.getByText('~1s')).toBeInTheDocument(); // delete-multiple: 2 * 0.5s = 1s
  });

  it('calls onAction when non-destructive action is clicked', async () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    const copyButton = screen.getByText('Copiar 2 elementos');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockOnAction).toHaveBeenCalledWith('copy-multiple', mockSelectedItems, undefined);
    });
  });

  it('shows confirmation dialog for destructive actions', async () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    const deleteButton = screen.getByText('Eliminar 2 elementos');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminar múltiples')).toBeInTheDocument();
      expect(screen.getByText('Se eliminarán 2 elementos permanentemente')).toBeInTheDocument();
      expect(screen.getByText('Tiempo estimado: ~1s')).toBeInTheDocument();
    });

    // Should not call onAction yet
    expect(mockOnAction).not.toHaveBeenCalled();
  });

  it('executes destructive action after confirmation', async () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    // Click delete button
    const deleteButton = screen.getByText('Eliminar 2 elementos');
    fireEvent.click(deleteButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminar múltiples')).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByText('Confirmar Eliminar múltiples');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnAction).toHaveBeenCalledWith('delete-multiple', mockSelectedItems, undefined);
    });
  });

  it('cancels destructive action when cancel is clicked', async () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    // Click delete button
    const deleteButton = screen.getByText('Eliminar 2 elementos');
    fireEvent.click(deleteButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminar múltiples')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirmar Eliminar múltiples')).not.toBeInTheDocument();
    });

    // Should not call onAction
    expect(mockOnAction).not.toHaveBeenCalled();
  });

  it('handles single item selection correctly', () => {
    const singleItem = [mockSelectedItems[0]];

    render(
      <MultiSelectionContextMenu
        selectedItems={singleItem}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    expect(screen.getByText('1 elemento seleccionado')).toBeInTheDocument();
    expect(screen.getByText('Copiar 1 elemento')).toBeInTheDocument();
    expect(screen.getByText('Eliminar 1 elemento')).toBeInTheDocument();
  });

  it('displays entity submenus for collections, tags, and albums', () => {
    render(
      <MultiSelectionContextMenu
        selectedItems={mockSelectedItems}
        onAction={mockOnAction}
        position={mockPosition}
      />
    );

    expect(screen.getByText('Colecciones')).toBeInTheDocument();
    expect(screen.getByText('Etiquetas')).toBeInTheDocument();
    expect(screen.getByText('Álbumes')).toBeInTheDocument();
  });
});