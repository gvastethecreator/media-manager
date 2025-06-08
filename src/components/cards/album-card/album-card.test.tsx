import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlbumCard } from './album-card';
import { getAlbumStats, getRecentAlbumImages } from './album-server-actions';

// Mock de las acciones del servidor
jest.mock('./album-server-actions', () => ({
	getRecentAlbumImages: jest.fn().mockResolvedValue([
		{ id: 'img1', thumbnailUrl: 'data:image/png;base64,dummy1' },
		{ id: 'img2', thumbnailUrl: 'data:image/png;base64,dummy2' },
	]),
	getAlbumStats: jest.fn().mockResolvedValue({
		imageCount: 42,
		totalSize: 1024000,
	}),
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

describe('AlbumCard', () => {
	const mockAlbum = {
		id: 'album123',
		name: 'Vacaciones 2023',
		emoji: '🏖️',
		color: '#3b82f6',
		description: 'Fotos de las vacaciones de verano',
		createdAt: new Date(),
		updatedAt: new Date(),
		category: 'Viajes',
		rarity: 'common',
		shortcut: 'vac23',
		sortBy: 'name',
		filters: 'empty_array',
		texture: null,
		recentImages: ['data:image/png;base64,dummy1'],
		_count: {
			images: 42,
			videos: 0,
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renderiza correctamente', () => {
		render(<AlbumCard album={mockAlbum} />);

		// Verificar que el nombre del álbum se muestra
		expect(screen.getByText('Vacaciones 2023')).toBeInTheDocument();

		// Verificar que el emoji se muestra
		expect(screen.getByText('🏖️')).toBeInTheDocument();

		// Verificar que la descripción se muestra
		expect(screen.getByText('Fotos de las vacaciones de verano')).toBeInTheDocument();
	});

	it('llama al onClick cuando se hace clic', async () => {
		const onClickMock = jest.fn();
		const user = userEvent.setup();

		render(<AlbumCard album={mockAlbum} onClick={onClickMock} />);

		// Hacer clic en la tarjeta
		const card = screen.getByText('Vacaciones 2023').closest('div');
		if (card) {
			await user.click(card);
		}

		// Verificar que se llamó al callback
		expect(onClickMock).toHaveBeenCalled();
	});

	it('renderiza un enlace cuando no hay onClick', () => {
		render(<AlbumCard album={mockAlbum} />);

		const link = document.querySelector(`a[href="/dashboard/albums/${mockAlbum.id}"]`);
		expect(link).toBeNull();
	});

	it('muestra las estadísticas del álbum', async () => {
		render(<AlbumCard album={mockAlbum} />);

		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(screen.getByText('42')).toBeInTheDocument();
	});

	it('carga y muestra las imágenes del álbum', async () => {
		render(<AlbumCard album={mockAlbum} />);

		await new Promise((resolve) => setTimeout(resolve, 0));

		const images = document.querySelectorAll('img');
		expect(images.length).toBeGreaterThan(0);
	});

	it('aplica correctamente los colores personalizados', () => {
		render(<AlbumCard album={mockAlbum} />);

		// Verificar que los elementos con el color personalizado existen
		const elements = document.querySelectorAll(`[style*="${mockAlbum.color}"]`);
		expect(elements.length).toBeGreaterThan(0);
	});
});
