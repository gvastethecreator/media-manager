import { render, screen, waitFor } from '@testing-library/react';
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
	return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

describe('FolderCard', () => {
	const mockFolder = {
		id: 'folder123',
		name: 'Vacaciones',
		emoji: '\ud83d\udcc1',
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
		stats: {
			totalFiles: 120,
			totalSize: 1024000,
			subfolders: 5,
			lastIndexed: new Date(),
			totalImages: 100,
			totalUploadedImages: 80,
			totalChildren: 2,
			images: [],
			folders: [],
			cover: null,
			coverType: null,
			coverBlurhash: null,
			totalTags: 0,
			lastUpdated: new Date(),
			createdAt: new Date(),
			level: 0,
			parentId: null,
			id: 'folder123',
			isRoot: false,
			isEmpty: false,
			hasChildren: true,
			size: 1024000,
		},
		metadata: {},
		featuredImage: null,
		presetId: null,
		cover: null,
		coverType: null,
		coverBlurhash: null,
		isDragging: false,
		isDropTarget: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renderiza correctamente', () => {
		render(<FolderCard folder={mockFolder} />);
		expect(screen.getByText('Vacaciones')).toBeInTheDocument();
		expect(screen.getByText('📁')).toBeInTheDocument();
		expect(screen.getByText('Fotos de vacaciones')).toBeInTheDocument();
	});

	it('llama al onClick cuando se hace clic', async () => {
		const onClickMock = jest.fn();
		const user = userEvent.setup();
		render(<FolderCard folder={mockFolder} onClick={onClickMock} />);
<<<<<<< HEAD
		// Buscar el botón principal de la tarjeta
		const button = screen.getByRole('button');
		await user.click(button);
		expect(onClickMock).toHaveBeenCalled();
	});

	it('renderiza un enlace cuando no hay onClick', async () => {
		render(<FolderCard folder={mockFolder} />);
		await waitFor(() => {
			const link = document.querySelector(`a[href="/dashboard/folders/${mockFolder.id}"]`);
			expect(link).toBeInTheDocument();
		});
	});

	it('muestra las estadísticas de la carpeta', async () => {
		render(<FolderCard folder={mockFolder} />);
		await waitFor(() => {
			expect(getFolderStats).toHaveBeenCalledWith(mockFolder.id);
			expect(screen.getByText('120')).toBeInTheDocument();
			expect(screen.getByText('5')).toBeInTheDocument();
		});
	});

	it('carga y muestra las imágenes de la carpeta', async () => {
		render(<FolderCard folder={mockFolder} />);
		await waitFor(() => {
			expect(getRecentFolderImages).toHaveBeenCalledWith(mockFolder.id);
			const images = document.querySelectorAll('img');
			expect(images.length).toBeGreaterThan(0);
		});
	});
=======

		// Hacer clic en la tarjeta
		const card = screen.getByText('Vacaciones').closest('div');
		if (card) {
			await user.click(card);
		}

                // Verificar que se llamó al callback
                expect(onClickMock).toHaveBeenCalled();
	});

       it('renderiza sin enlace cuando no hay onClick', () => {
               render(<FolderCard folder={mockFolder} />);

               // No debe existir un enlace de navegación por defecto
               const link = document.querySelector(`a[href="/dashboard/folders/${mockFolder.id}"]`);
               expect(link).toBeNull();
       });

       it('muestra las estadísticas de la carpeta', async () => {
               render(<FolderCard folder={mockFolder} />);

               await new Promise((resolve) => setTimeout(resolve, 0));

               expect(screen.getByText('120')).toBeInTheDocument();
       });

       it('carga y muestra las imágenes de la carpeta', async () => {
               render(<FolderCard folder={mockFolder} />);

               await new Promise((resolve) => setTimeout(resolve, 0));

               const images = document.querySelectorAll('img');
               expect(images.length).toBe(0);
       });
>>>>>>> 073d42e736549c076ab943c2b4179974562a9519

	it('aplica correctamente los colores personalizados', () => {
		render(<FolderCard folder={mockFolder} />);
		const elements = document.querySelectorAll(`[style*="${mockFolder.color}"]`);
		expect(elements.length).toBeGreaterThan(0);
	});

<<<<<<< HEAD
	it('muestra el indicador de favorito cuando corresponde', async () => {
		render(<FolderCard folder={mockFolder} />);
		await waitFor(() => {
			// Buscar el icono Star (Lucide) que indica favorito
			const favoriteIcon = document.querySelector('svg.feather-star, svg.feather.feather-star');
			expect(favoriteIcon).toBeInTheDocument();
		});
	});
=======
       it('muestra el indicador de favorito cuando corresponde', () => {
               render(<FolderCard folder={{ ...mockFolder, isFavorite: true }} />);

               // Buscar el icono de favorito
               const star = document.querySelector('svg.lucide-star');
               expect(star).not.toBeNull();
       });
>>>>>>> 073d42e736549c076ab943c2b4179974562a9519
});
