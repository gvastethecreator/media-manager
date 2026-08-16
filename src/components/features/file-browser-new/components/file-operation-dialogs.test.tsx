import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MoveDialog } from './move-dialog';
import { RenameDialog } from './rename-dialog';
import type { BrowserItem } from '../types/item.types';

vi.mock('@/lib/api/folders', () => ({
	useFolders: () => ({
		data: {
			data: [
				{ id: 'folder-a', name: 'Folder A' },
				{ id: 'folder-b', name: 'Folder B' },
			],
		},
		isLoading: false,
	}),
}));

const firstItem: BrowserItem = { entityType: 'image', id: 'item-a', name: 'first.jpg' };
const secondItem: BrowserItem = { entityType: 'image', id: 'item-b', name: 'second.jpg' };

describe('file operation dialogs', () => {
	it('resets the name when another asset is opened', () => {
		const view = render(<RenameDialog isOpen items={[firstItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		const input = screen.getByLabelText('New name');
		fireEvent.change(input, { target: { value: 'temporary.jpg' } });
		expect(input).toHaveValue('temporary.jpg');

		view.rerender(<RenameDialog isOpen={false} items={[]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		view.rerender(<RenameDialog isOpen items={[secondItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);

		expect(screen.getByLabelText('New name')).toHaveValue('second.jpg');
	});

	it('does not keep the selected folder when the move dialog is reopened', () => {
		const view = render(<MoveDialog isOpen items={[firstItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: /Folder A/i }));
		expect(screen.getByRole('button', { name: /^Move 1 item$/i })).toBeEnabled();

		view.rerender(<MoveDialog isOpen={false} items={[]} onCancel={vi.fn()} onConfirm={vi.fn()} />);
		view.rerender(<MoveDialog isOpen items={[secondItem]} onCancel={vi.fn()} onConfirm={vi.fn()} />);

		expect(screen.getByRole('button', { name: /^Move 1 item$/i })).toBeDisabled();
	});
});
