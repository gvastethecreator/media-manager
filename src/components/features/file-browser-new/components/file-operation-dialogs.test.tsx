import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MoveDialog } from './move-dialog';
import { RenameDialog } from './rename-dialog';
import type { BrowserItem } from '../types/item.types';

vi.mock('@/lib/api/folders', () => ({
	useFolders: () => ({
		data: {
			data: [
				{ id: 'folder-a', name: 'Carpeta A' },
				{ id: 'folder-b', name: 'Carpeta B' },
			],
		},
		isLoading: false,
	}),
}));

const firstItem: BrowserItem = { entityType: 'image', id: 'item-a', name: 'primero.jpg' };
const secondItem: BrowserItem = { entityType: 'image', id: 'item-b', name: 'segundo.jpg' };

describe('file operation dialogs', () => {
	it('restablece el nombre al abrir otro asset', () => {
		const view = render(<RenameDialog isOpen items={[firstItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		const input = screen.getByLabelText('Nuevo nombre');
		fireEvent.change(input, { target: { value: 'temporal.jpg' } });
		expect(input).toHaveValue('temporal.jpg');

		view.rerender(<RenameDialog isOpen={false} items={[]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		view.rerender(<RenameDialog isOpen items={[secondItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);

		expect(screen.getByLabelText('Nuevo nombre')).toHaveValue('segundo.jpg');
	});

	it('no conserva la carpeta elegida al reabrir el movimiento', () => {
		const view = render(<MoveDialog isOpen items={[firstItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: /Carpeta A/i }));
		expect(screen.getByRole('button', { name: /^Mover 1 item$/i })).toBeEnabled();

		view.rerender(<MoveDialog isOpen={false} items={[]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		view.rerender(<MoveDialog isOpen items={[secondItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);

		expect(screen.getByRole('button', { name: /^Mover 1 item$/i })).toBeDisabled();
	});
});
