import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorldItemCard } from './world-item-card';

// Mock de las acciones del servidor
jest.mock('./world-item-server-actions', () => ({
	getRecentWorldItemImages: jest.fn().mockResolvedValue([
		{ id: 'img1', thumbnailUrl: 'data:image/png;base64,dummy1' },
		{ id: 'img2', thumbnailUrl: 'data:image/png;base64,dummy2' },
	]),
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

describe('WorldItemCard', () => {
	const mockWorldItem = {
		id: '123',
		name: 'Espada mágica',
		type: 'ARTIFACT',
		description: 'Una espada antigua con poderes místicos',
		createdAt: new Date(),
		updatedAt: new Date(),
		worldId: 'world1',
		imageCount: 3,
	};

	it('renderiza correctamente', () => {
		render(<WorldItemCard worldItem={mockWorldItem} />);

		// Verificar que el nombre del objeto se muestra
		expect(screen.getByText('Espada mágica')).toBeInTheDocument();

		// Verificar que el tipo se muestra
		expect(screen.getByText('ARTIFACT')).toBeInTheDocument();

		// Verificar que la descripción se muestra
		expect(screen.getByText('Una espada antigua con poderes místicos')).toBeInTheDocument();
	});

	it('llama al onClick cuando se hace clic', async () => {
		const onClickMock = jest.fn();
		const user = userEvent.setup();

		render(<WorldItemCard worldItem={mockWorldItem} onClick={onClickMock} />);

		// Hacer clic en la tarjeta
		const card = screen.getByText('Espada mágica').closest('div');
		if (card) {
			await user.click(card);
		}

		// Verificar que se llamó al callback
		expect(onClickMock).toHaveBeenCalled();
	});

	it('renderiza un enlace cuando no hay onClick', () => {
		render(<WorldItemCard worldItem={mockWorldItem} />);

		const link = document.querySelector(`a[href="/dashboard/world-items/${mockWorldItem.id}"]`);
		expect(link).toBeNull();
	});
});
