import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AllImagesContentView from './all-images-content-view';

vi.mock('@/components/features/file-browser-new/file-browser', () => ({
	FileBrowser: () => <div data-testid="file-browser" />,
}));

describe('AllImagesContentView', () => {
	it('routes media intake and reindexing to the authorized file browser', () => {
		render(
			<AllImagesContentView
				error={null}
				handleImageClick={vi.fn()}
				handleImageDoubleClick={vi.fn()}
				images={[]}
				isLoading={false}
			/>
		);

		expect(screen.getByRole('link', { name: 'Abrir explorador de archivos' })).toHaveAttribute('href', '/files');
		expect(screen.getByRole('link', { name: 'Gestionar reindexado' })).toHaveAttribute('href', '/files');
		expect(screen.queryByRole('button', { name: 'Reindexar' })).not.toBeInTheDocument();
		expect(screen.queryByText('Subir Imágenes')).not.toBeInTheDocument();
		expect(screen.queryByLabelText('Seleccionar Imágenes')).not.toBeInTheDocument();
	});
});
