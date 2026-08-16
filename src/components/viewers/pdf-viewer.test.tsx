import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { PdfViewer } from './pdf-viewer';

vi.mock('react-pdf', () => ({
	Document: ({
		children,
		onLoadError,
		onLoadSuccess,
	}: {
		children: ReactNode;
		onLoadError: () => void;
		onLoadSuccess: (document: { numPages: number }) => void;
	}) => (
		<div data-testid="pdf-document">
			<button onClick={() => onLoadSuccess({ numPages: 2 })} type="button">
				Complete load
			</button>
			<button onClick={onLoadError} type="button">
				Force error
			</button>
			{children}
		</div>
	),
	Page: ({ pageNumber }: { pageNumber: number }) => <div>{`Rendered page ${pageNumber}`}</div>,
	pdfjs: { GlobalWorkerOptions: {} },
}));

describe('PdfViewer', () => {
	it('mounts the document while loading and enables navigation after it resolves', async () => {
		render(
			<PdfViewer
				file={{ id: 'document-1', name: 'example.pdf', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
		expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
			'href',
			'/api/documents/document-1/content'
		);
		expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('download', 'example.pdf');
		fireEvent.click(screen.getByRole('button', { name: 'Complete load' }));

		await waitFor(() => expect(screen.getByText('Page 1 of 2')).toBeInTheDocument());
		expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
	});

	it('explains an invalid PDF and allows retrying without closing the dialog', () => {
		render(
			<PdfViewer
				file={{ id: 'document-1', name: 'broken.pdf', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: 'Force error' }));
		expect(screen.getByRole('alert')).toHaveTextContent(
			'The PDF could not be loaded. Check that the file is not damaged or protected.'
		);
		fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});
});
