import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { render, screen, waitFor } from '@/test/test-utils';
import type { FileItem } from '@/types/file-browser/file-item';
import { MultiSelectionContextMenu } from './multi-selection-context-menu';

// Mock the stores
mock.module('@/store/entities/album', () => ({
	useAlbumStore: mock((selector) => {
		const mockState = { albums: {} };
		return selector ? selector(mockState) : mockState;
	}),
}));

mock.module('@/store/entities/collection', () => ({
	useCollectionStore: mock((selector) => {
		const mockState = { collections: {} };
		return selector ? selector(mockState) : mockState;
	}),
}));

mock.module('@/store/entities/tag', () => ({
	useTagStore: mock((selector) => {
		const mockState = { getTags: () => [] };
		return selector ? selector(mockState) : mockState;
	}),
}));

// Mock the toast service
mock.module('@/lib/ui/toast', () => ({
	toastService: {
		success: mock(),
		error: mock(),
		info: mock(),
	},
}));

// Mock the keyboard navigation hook
mock.module('@/lib/keyboard', () => ({
	useContextMenuNavigation: mock(() => ({
		selectedIndex: -1,
		getItemProps: mock(() => ({})),
	})),
}));

describe('MultiSelectionContextMenu', () => {
	const mockSelectedItems: FileItem[] = [
		{
			id: '1',
			name: 'test-image-1.jpg',
			type: 'file',
			size: 1024,
			modifiedAt: new Date('2023-01-02'),
			path: '/test/test-image-1.jpg',
			isDirectory: false,
			extension: 'jpg',
			mimeType: 'image/jpeg',
			thumbnailUrl: 'https://example.com/thumb1.jpg',
			isFavorite: false,
			metadata: {
				fileSize: '1 KB',
				width: 800,
				height: 600,
			},
		},
		{
			id: '2',
			name: 'test-image-2.jpg',
			type: 'file',
			size: 2048,
			modifiedAt: new Date('2023-01-04'),
			path: '/test/test-image-2.jpg',
			isDirectory: false,
			extension: 'jpg',
			mimeType: 'image/jpeg',
			thumbnailUrl: 'https://example.com/thumb2.jpg',
			isFavorite: false,
			metadata: {
				fileSize: '2 KB',
				width: 1024,
				height: 768,
			},
		},
	];

	const mockOnAction = mock();
	const mockPosition = { x: 100, y: 100 };

	beforeEach(() => {
		mock.restore();
	});

	it('renders with correct selection count', () => {
		render(
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
		);

		expect(screen.getByText('2 elementos seleccionados')).toBeInTheDocument();
		expect(screen.getByText(/Tamaño total: 3,072 bytes/)).toBeInTheDocument();
	});

	it('displays all bulk operation actions', () => {
		render(
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
		);

		expect(screen.getByText('Copiar 2 elementos')).toBeInTheDocument();
		expect(screen.getByText('Mover 2 elementos')).toBeInTheDocument();
		expect(screen.getByText('Descargar 2 elementos')).toBeInTheDocument();
		expect(screen.getByText('Eliminar 2 elementos')).toBeInTheDocument();
	});

	it('shows estimated time for operations', () => {
		render(
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
		);

		// Check that estimated times are displayed (they should be ~1s, ~2s, ~4s, ~1s for the operations)
		expect(screen.getByText('~3s')).toBeInTheDocument(); // copy-multiple: 2 * 1.5s = 3s
		expect(screen.getByText('~2s')).toBeInTheDocument(); // move-multiple: 2 * 1.0s = 2s
		expect(screen.getByText('~4s')).toBeInTheDocument(); // download-multiple: 2 * 2.0s = 4s
		expect(screen.getByText('~1s')).toBeInTheDocument(); // delete-multiple: 2 * 0.5s = 1s
	});

	it('calls onAction when non-destructive action is clicked', async () => {
		render(
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
		);

		const copyButton = screen.getByText('Copiar 2 elementos');
		fireEvent.click(copyButton);

		await waitFor(() => {
			expect(mockOnAction).toHaveBeenCalledWith('copy-multiple', mockSelectedItems, undefined);
		});
	});

	it('shows confirmation dialog for destructive actions', async () => {
		render(
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
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
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
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
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
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

		render(<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={singleItem} />);

		expect(screen.getByText('1 elemento seleccionado')).toBeInTheDocument();
		expect(screen.getByText('Copiar 1 elemento')).toBeInTheDocument();
		expect(screen.getByText('Eliminar 1 elemento')).toBeInTheDocument();
	});

	it('displays entity submenus for collections, tags, and albums', () => {
		render(
			<MultiSelectionContextMenu onAction={mockOnAction} position={mockPosition} selectedItems={mockSelectedItems} />
		);

		expect(screen.getByText('Colecciones')).toBeInTheDocument();
		expect(screen.getByText('Etiquetas')).toBeInTheDocument();
		expect(screen.getByText('Álbumes')).toBeInTheDocument();
	});
});
