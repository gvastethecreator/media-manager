import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { PdfViewer } from './pdf-viewer';

vi.mock('react-pdf', () => ({
	Document: ({
		children,
		onLoadSuccess,
	}: {
		children: ReactNode;
		onLoadSuccess: (document: { numPages: number }) => void;
	}) => (
		<div data-testid="pdf-document">
			<button onClick={() => onLoadSuccess({ numPages: 2 })} type="button">
				Completar carga
			</button>
			{children}
		</div>
	),
	Page: ({ pageNumber }: { pageNumber: number }) => <div>{`Página renderizada ${pageNumber}`}</div>,
	pdfjs: { GlobalWorkerOptions: {} },
}));

describe('PdfViewer', () => {
	it('monta el documento mientras muestra la carga y habilita la navegación al resolverlo', async () => {
		render(
			<PdfViewer
				file={{ id: 'document-1', name: 'example.pdf', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		expect(screen.getByText('Cargando...')).toBeInTheDocument();
		expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Completar carga' }));

		await waitFor(() => expect(screen.getByText('Página 1 de 2')).toBeInTheDocument());
		expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
	});
});
