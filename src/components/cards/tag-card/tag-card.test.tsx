import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagCard } from './tag-card';

// Mock de las acciones del servidor
jest.mock('./tag-server-actions', () => ({
	getTagImages: jest.fn().mockResolvedValue([
		{ id: 'img1', thumbnailUrl: 'data:image/png;base64,dummy1' },
		{ id: 'img2', thumbnailUrl: 'data:image/png;base64,dummy2' },
	]),
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

describe('TagCard', () => {
	const mockTag = {
		id: 'tag123',
		name: 'Paisajes',
		emoji: '🏞️',
		color: '#3b82f6',
		description: 'Etiqueta para fotografías de paisajes',
		createdAt: new Date(),
		updatedAt: new Date(),
		isFavorite: true,
		category: 'Naturaleza',
		rarity: 'common',
		imageCount: 42,
	};

	it('renderiza correctamente', () => {
		render(<TagCard tag={mockTag} />);

		// Verificar que el nombre de la etiqueta se muestra
		expect(screen.getByText('Paisajes')).toBeInTheDocument();

		// Verificar que el emoji se muestra
		expect(screen.getByText('🏞️')).toBeInTheDocument();

		// Verificar que la descripción se muestra
		expect(screen.getByText('Etiqueta para fotografías de paisajes')).toBeInTheDocument();

		// Verificar que el número de imágenes se muestra
		expect(screen.getByText('42')).toBeInTheDocument();
	});

	it('llama al onClick cuando se hace clic', async () => {
		const onClickMock = jest.fn();
		const user = userEvent.setup();

		render(<TagCard tag={mockTag} onClick={onClickMock} />);

		// Hacer clic en la tarjeta (contenedor principal)
		const card = screen.getByText('Paisajes').closest('div');
		if (card) {
			await user.click(card);
		}

		// Verificar que se llamó al callback
		expect(onClickMock).toHaveBeenCalledWith(mockTag);
	});

	it('renderiza un enlace cuando no hay onClick', () => {
		render(<TagCard tag={mockTag} />);

		// Verificar que hay un enlace a la página de la etiqueta
		const link = document.querySelector(`a[href="/dashboard/tags/${mockTag.id}"]`);
		expect(link).toBeInTheDocument();
	});

	it('aplica correctamente los colores personalizados', () => {
		render(<TagCard tag={mockTag} />);

		// Verificar que los elementos con el color personalizado existen
		// Nota: Esta es una forma simplificada; en la práctica deberíamos verificar los estilos aplicados
		// pero eso requeriría una configuración más compleja de testing
		const elements = document.querySelectorAll(`[style*="${mockTag.color}"]`);
		expect(elements.length).toBeGreaterThan(0);
	});

	it('renderiza el badge de favorito cuando la etiqueta es favorita', () => {
		render(<TagCard tag={mockTag} />);

		// Verificar que se muestra el badge de favorito
		// (podría ser un icono o texto, adaptar según la implementación)
		const favoriteElement = document.querySelector('.favorite-badge');
		expect(favoriteElement).toBeInTheDocument();
	});
});
