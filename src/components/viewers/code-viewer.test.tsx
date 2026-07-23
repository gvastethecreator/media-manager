import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { CodeViewer } from './code-viewer';

vi.mock('@monaco-editor/react', () => ({
	default: ({ value }: { value: string }) => <div data-testid="monaco-editor">{value}</div>,
}));

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

	it('espera la fuente antes de montar Monaco', async () => {
		render(
			<CodeViewer
				file={{ id: 'document-1', name: 'documento.txt', url: '/api/documents/document-1/content' }}
				isOpen
				onOpenChange={vi.fn()}
			/>
		);

		expect(screen.getByText('Cargando archivo...')).toBeInTheDocument();
		expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();

		await waitFor(() =>
			expect(screen.getByTestId('monaco-editor')).toHaveTextContent('Contenido seguro del documento')
		);
	});
});
