/**
 * Tests for FeaturedImageSelector component
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { FeaturedImageSelector } from '../featured-image-selector';

describe('FeaturedImageSelector', () => {
	const mockImages = [
		{
			id: 'img-1',
			name: 'Test Image 1',
			thumbnailUrl: '/thumbnails/img-1.jpg',
			path: '/images/img-1.jpg',
		},
		{
			id: 'img-2',
			name: 'Test Image 2',
			thumbnailUrl: '/thumbnails/img-2.jpg',
			path: '/images/img-2.jpg',
		},
		{
			id: 'img-3',
			name: 'Test Image 3',
			thumbnailUrl: '/thumbnails/img-3.jpg',
			path: '/images/img-3.jpg',
		},
		{
			id: 'img-4',
			name: 'Not Associated Image',
			thumbnailUrl: '/thumbnails/img-4.jpg',
			path: '/images/img-4.jpg',
		},
	];

	const mockOnSelect = vi.fn();

	it('should render without current image', () => {
		render(
			<FeaturedImageSelector imageIds={['img-1', 'img-2', 'img-3']} images={mockImages} onSelect={mockOnSelect} />
		);

		// Should show label
		expect(screen.getByText('Imagen Destacada')).toBeInTheDocument();

		// Should show placeholder icon
		const imageIcon = document.querySelector('.lucide-image');
		expect(imageIcon).toBeInTheDocument();

		// Should show "Seleccionar Imagen" button
		expect(screen.getByRole('button', { name: /seleccionar imagen/i })).toBeInTheDocument();
	});

	it('should render with current featured image', () => {
		const { getByAltText, getByRole } = render(
			<FeaturedImageSelector
				currentFeaturedImage="/featured/img-1.jpg"
				imageIds={['img-1', 'img-2', 'img-3']}
				images={mockImages}
				onSelect={mockOnSelect}
			/>
		);

		// Should show current image
		const currentImage = getByAltText('Featured');
		expect(currentImage).toBeInTheDocument();
		expect(currentImage).toHaveAttribute('src', '/featured/img-1.jpg');

		// Should show "Cambiar Imagen" button
		expect(getByRole('button', { name: /cambiar imagen/i })).toBeInTheDocument();
	});

	it('should show message when no images are available', () => {
		render(<FeaturedImageSelector imageIds={[]} images={mockImages} onSelect={mockOnSelect} />);

		// Should show no images message
		expect(screen.getByText(/no hay imágenes asociadas disponibles/i)).toBeInTheDocument();

		// Button should be disabled
		const selectButton = screen.getByRole('button', { name: /seleccionar imagen/i });
		expect(selectButton).toBeDisabled();
	});

	it('should open modal on button click', async () => {
		render(
			<FeaturedImageSelector imageIds={['img-1', 'img-2', 'img-3']} images={mockImages} onSelect={mockOnSelect} />
		);

		const selectButton = screen.getByRole('button', { name: /seleccionar imagen/i });
		fireEvent.click(selectButton);

		// Modal should be visible
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		// Modal should have title
		expect(screen.getByText('Seleccionar Imagen Destacada')).toBeInTheDocument();
		expect(screen.getByText(/elige una imagen de las asociadas/i)).toBeInTheDocument();
	});

	it('should show all available images in modal', async () => {
		const { getByRole, getByAltText, queryByAltText } = render(
			<FeaturedImageSelector imageIds={['img-1', 'img-2', 'img-3']} images={mockImages} onSelect={mockOnSelect} />
		);

		const selectButton = getByRole('button', { name: /seleccionar imagen/i });
		fireEvent.click(selectButton);

		await waitFor(() => {
			expect(getByRole('dialog')).toBeInTheDocument();
		});

		// Should show all associated images
		expect(getByAltText('Test Image 1')).toBeInTheDocument();
		expect(getByAltText('Test Image 2')).toBeInTheDocument();
		expect(getByAltText('Test Image 3')).toBeInTheDocument();

		// Should NOT show the non-associated image
		expect(queryByAltText('Not Associated Image')).not.toBeInTheDocument();
	});

	it('should allow selecting an image in modal', async () => {
		const { getByRole, getByAltText } = render(
			<FeaturedImageSelector imageIds={['img-1', 'img-2', 'img-3']} images={mockImages} onSelect={mockOnSelect} />
		);

		const selectButton = getByRole('button', { name: /seleccionar imagen/i });
		fireEvent.click(selectButton);

		await waitFor(() => {
			expect(getByRole('dialog')).toBeInTheDocument();
		});

		// Initially, confirm button should be disabled
		const confirmButton = getByRole('button', { name: /confirmar selección/i });
		expect(confirmButton).toBeDisabled();

		// Click on first image
		const image1Button = getByAltText('Test Image 1').closest('button');
		expect(image1Button).toBeInTheDocument();
		fireEvent.click(image1Button!);

		// Confirm button should now be enabled
		await waitFor(() => {
			expect(confirmButton).not.toBeDisabled();
		});
	});

	it('should call onSelect when confirming selection', async () => {
		const onSelectMock = vi.fn();
		const { getByRole, getByAltText, queryByRole } = render(
			<FeaturedImageSelector imageIds={['img-1', 'img-2', 'img-3']} images={mockImages} onSelect={onSelectMock} />
		);

		const selectButton = getByRole('button', { name: /seleccionar imagen/i });
		fireEvent.click(selectButton);

		await waitFor(() => {
			expect(getByRole('dialog')).toBeInTheDocument();
		});

		// Select an image
		const image1Button = getByAltText('Test Image 1').closest('button');
		fireEvent.click(image1Button!);

		// Confirm selection
		const confirmButton = getByRole('button', { name: /confirmar selección/i });
		await waitFor(() => {
			expect(confirmButton).not.toBeDisabled();
		});
		fireEvent.click(confirmButton);

		// onSelect should be called with selected image ID
		await waitFor(() => {
			expect(onSelectMock).toHaveBeenCalledWith('img-1');
		});

		// Modal should be closed
		await waitFor(() => {
			expect(queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	it('should allow removing current featured image', async () => {
		const onSelectMock = vi.fn();
		const { container } = render(
			<FeaturedImageSelector
				currentFeaturedImage="/featured/img-1.jpg"
				imageIds={['img-1', 'img-2', 'img-3']}
				images={mockImages}
				onSelect={onSelectMock}
			/>
		);

		// Find the remove button (X icon) - it's inside a button with lucide-x class
		const removeButton = container.querySelector('button:has(.lucide-x)');
		expect(removeButton).toBeInTheDocument();

		fireEvent.click(removeButton!);

		// onSelect should be called with null
		await waitFor(() => {
			expect(onSelectMock).toHaveBeenCalledWith(null);
		});
	});

	it('should only show associated images (filtered by imageIds)', async () => {
		const { getByRole, getByAltText, queryByAltText } = render(
			<FeaturedImageSelector
				imageIds={['img-1', 'img-2']} // Only first two images are associated
				images={mockImages}
				onSelect={mockOnSelect}
			/>
		);

		const selectButton = getByRole('button', { name: /seleccionar imagen/i });
		fireEvent.click(selectButton);

		await waitFor(() => {
			expect(getByRole('dialog')).toBeInTheDocument();
		});

		// Should show only associated images
		expect(getByAltText('Test Image 1')).toBeInTheDocument();
		expect(getByAltText('Test Image 2')).toBeInTheDocument();

		// Should NOT show non-associated images
		expect(queryByAltText('Test Image 3')).not.toBeInTheDocument();
		expect(queryByAltText('Not Associated Image')).not.toBeInTheDocument();
	});

	it('should be disabled when disabled prop is true', () => {
		render(
			<FeaturedImageSelector
				disabled={true}
				imageIds={['img-1', 'img-2', 'img-3']}
				images={mockImages}
				onSelect={mockOnSelect}
			/>
		);

		const selectButton = screen.getByRole('button', { name: /seleccionar imagen/i });
		expect(selectButton).toBeDisabled();
	});

	it('should close modal when cancel button is clicked', async () => {
		render(
			<FeaturedImageSelector imageIds={['img-1', 'img-2', 'img-3']} images={mockImages} onSelect={mockOnSelect} />
		);

		const selectButton = screen.getByRole('button', { name: /seleccionar imagen/i });
		fireEvent.click(selectButton);

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		const cancelButton = screen.getByRole('button', { name: /cancelar/i });
		fireEvent.click(cancelButton);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	it('should use thumbnail URL if available, otherwise path', async () => {
		const imagesWithMixedUrls = [
			{
				id: 'img-1',
				name: 'Image with thumbnail',
				thumbnailUrl: '/thumbnails/img-1.jpg',
				path: '/images/img-1.jpg',
			},
			{
				id: 'img-2',
				name: 'Image without thumbnail',
				path: '/images/img-2.jpg',
			},
		];

		const { getByRole, getByAltText } = render(
			<FeaturedImageSelector imageIds={['img-1', 'img-2']} images={imagesWithMixedUrls} onSelect={mockOnSelect} />
		);

		const selectButton = getByRole('button', { name: /seleccionar imagen/i });
		fireEvent.click(selectButton);

		await waitFor(() => {
			expect(getByRole('dialog')).toBeInTheDocument();
		});

		// First image should use thumbnailUrl
		const img1 = getByAltText('Image with thumbnail') as HTMLImageElement;
		expect(img1.src).toContain('/thumbnails/img-1.jpg');

		// Second image should use path
		const img2 = getByAltText('Image without thumbnail') as HTMLImageElement;
		expect(img2.src).toContain('/images/img-2.jpg');
	});
});
