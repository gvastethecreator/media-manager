import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UploadedImagesSettings } from './uploaded-images-settings';

describe('UploadedImagesSettings', () => {
	it('replaces the unsafe upload controls with the authorized ingest path', () => {
		render(<UploadedImagesSettings />);

		expect(screen.getByRole('heading', { name: 'Cargas directas retiradas' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Abrir explorador de archivos' })).toHaveAttribute('href', '/files');
		expect(screen.queryByText('Eliminar todas las imágenes')).not.toBeInTheDocument();
	});

	it('renders the authorized ingest link through Button asChild', () => {
		render(<UploadedImagesSettings />);

		expect(screen.getByRole('link', { name: 'Abrir explorador de archivos' })).toBeVisible();
	});
});
