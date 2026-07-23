import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { CodeViewer } from './code-viewer';

describe('CodeViewer', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve('Contenido seguro del documento'),
			})
		);
	});

	it('espera la fuente antes de mostrar el contenido nativo', async () => {
		render(
			<CodeViewer
				file={{ id: 'document-1', name: 'documento.txt', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		expect(screen.getByText('Cargando archivo...')).toBeInTheDocument();
		expect(screen.queryByTestId('document-content')).not.toBeInTheDocument();

		await waitFor(() =>
			expect(screen.getByTestId('document-content')).toHaveTextContent('Contenido seguro del documento')
		);
	});

	it('muestra una recuperación cuando la fuente autorizada falla', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
		render(
			<CodeViewer
				file={{ id: 'document-1', name: 'documento.txt', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el contenido'));
		expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		expect(fetch).toHaveBeenCalledTimes(2);
	});
});
