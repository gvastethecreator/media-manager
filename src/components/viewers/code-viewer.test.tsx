import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { CodeViewer } from './code-viewer';

describe('CodeViewer', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve('Safe document content'),
			})
		);
	});

	it('waits for the source before showing native content', async () => {
		render(
			<CodeViewer
				file={{ id: 'document-1', name: 'document.txt', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		expect(screen.getByText('Loading file...')).toBeInTheDocument();
		expect(screen.queryByTestId('document-content')).not.toBeInTheDocument();

		await waitFor(() =>
			expect(screen.getByTestId('document-content')).toHaveTextContent('Safe document content')
		);
	});

	it('shows a recovery action when the authorized source fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
		render(
			<CodeViewer
				file={{ id: 'document-1', name: 'document.txt', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('File content could not be loaded.'));
		expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(fetch).toHaveBeenCalledTimes(2);
	});
});
