import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AllImagesContentView from './all-images-content-view';

vi.mock('@/components/features/file-browser-new/file-browser', () => ({
	FileBrowser: () => <div data-testid="file-browser" />,
}));

describe('AllImagesContentView', () => {
	it('replaces the unmounted direct upload with the authorized file browser', () => {
		render(
			<AllImagesContentView
				error={null}
				handleImageClick={vi.fn()}
				handleImageDoubleClick={vi.fn()}
				images={[]}
				indexingStatus={{ currentFolder: null, errors: [], indexedFolders: 0, totalFolders: 0 }}
				isIndexing={false}
				isLoading={false}
				progress={0}
				startIndexing={vi.fn()}
			/>
		);

		expect(screen.getByRole('link', { name: 'Abrir explorador de archivos' })).toHaveAttribute('href', '/files');
		expect(screen.queryByText('Subir Imágenes')).not.toBeInTheDocument();
		expect(screen.queryByLabelText('Seleccionar Imágenes')).not.toBeInTheDocument();
	});
});
