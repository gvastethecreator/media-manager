import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderCard } from './folder-card';
import { getFolderStats, getRecentFolderImages } from './folder-server-actions';

// Mock de las acciones del servidor
jest.mock('./folder-server-actions', () => ({
	getRecentFolderImages: jest.fn().mockResolvedValue([
		{ id: 'img1', thumbnailUrl: 'data:image/png;base64,dummy1' },
		{ id: 'img2', thumbnailUrl: 'data:image/png;base64,dummy2' },
	]),
	getFolderStats: jest.fn().mockResolvedValue({
		totalFiles: 120,
		totalSize: 1024000,
		subfolders: 5,
	}),
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	);
});

describe('FolderCard', () => {
	const mockFolder = {
		id: 'folder123',
		name: 'Vacaciones',
		emoji: '📁',
		color: '#3b82f6',
		description: 'Fotos de vacaciones',
		path: '/vacaciones',
		parentId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		totalFiles: 120,
		totalSize: 1024000,
		isFavorite: true,
		autoReindex: false,
		lastIndexed: new Date(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renderiza correctamente', () => {
		render(<FolderCard folder={mockFolder} />);

		// Verificar que el nombre de la carpeta se muestra
		expect(screen.getByText('Vacaciones')).toBeInTheDocument();

		// Verificar que el emoji se muestra
		expect(screen.getByText('📁')).toBeInTheDocument();

		// Verificar que la descripción se muestra
		expect(screen.getByText('Fotos de vacaciones')).toBeInTheDocument();
	});

	it('llama al onClick cuando se hace clic', async () => {
		const onClickMock = jest.fn();
		const user = userEvent.setup();

		render(<FolderCard folder={mockFolder} onClick={onClickMock} />);

		// Hacer clic en la tarjeta
		const card = screen.getByText('Vacaciones').closest('div');
		if (card) {
			await user.click(card);
		}

		// Verificar que se llamó al callback
		expect(onClickMock).toHaveBeenCalledWith(mockFolder);
	});

	it('renderiza un enlace cuando no hay onClick', () => {
		render(<FolderCard folder={mockFolder} />);

		// Verificar que hay un enlace a la página de la carpeta
		const link = document.querySelector(`a[href="/dashboard/folders/${mockFolder.id}"]`);
		expect(link).toBeInTheDocument();
	});

	it('muestra las estadísticas de la carpeta', async () => {
		render(<FolderCard folder={mockFolder} />);

		// Verificar que se llamó a getFolderStats
		expect(getFolderStats).toHaveBeenCalledWith(mockFolder.id);

		// Como las estadísticas se cargan de forma asíncrona, debemos esperar
		await new Promise(resolve => setTimeout(resolve, 0));

		// Verificar que se muestran las estadísticas
		expect(screen.getByText('120')).toBeInTheDocument(); // número de archivos
		expect(screen.getByText('5')).toBeInTheDocument(); // número de subcarpetas
	});

	it('carga y muestra las imágenes de la carpeta', async () => {
		render(<FolderCard folder={mockFolder} />);

		// Verificar que se llamó a getRecentFolderImages
		expect(getRecentFolderImages).toHaveBeenCalledWith(mockFolder.id);

		// Como las imágenes se cargan de forma asíncrona, debemos esperar
		await new Promise(resolve => setTimeout(resolve, 0));

		// Verificar que se muestran las imágenes (o al menos sus contenedores)
		const images = document.querySelectorAll('img');
		expect(images.length).toBeGreaterThan(0);
	});

	it('aplica correctamente los colores personalizados', () => {
		render(<FolderCard folder={mockFolder} />);

		// Verificar que los elementos con el color personalizado existen
		const elements = document.querySelectorAll(`[style*="${mockFolder.color}"]`);
		expect(elements.length).toBeGreaterThan(0);
	});

	it('muestra el indicador de favorito cuando corresponde', () => {
		render(<FolderCard folder={mockFolder} />);

		// Verificar que se muestra el indicador de favorito
		const favoriteIndicator = screen.getByTestId('favorite-indicator');
		expect(favoriteIndicator).toBeInTheDocument();
	});
});