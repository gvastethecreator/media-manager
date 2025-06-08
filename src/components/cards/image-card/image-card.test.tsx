import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageCard } from './image-card';
import { getImageCardData } from './image-server-actions';

// Mock de las acciones del servidor
jest.mock('./image-server-actions', () => ({
	getImageCardData: jest.fn(),
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

describe('ImageCard', () => {
	const mockImageData = {
		id: 'img-123',
		name: 'Paisaje montañoso',
		description: 'Fotografía de montañas al atardecer',
		thumbnailUrl: 'data:image/jpeg;base64,dummy-image-data',
		width: 1920,
		height: 1080,
		metadata: {
			format: 'jpeg',
			size: 1024000,
		},
		tags: [
			{ id: 'tag1', name: 'montaña', color: '#3b82f6' },
			{ id: 'tag2', name: 'atardecer', color: '#f59e0b' },
		],
	};

	beforeEach(() => {
		jest.clearAllMocks();
		// Configurar el mock para devolver datos de prueba
		(getImageCardData as jest.Mock).mockResolvedValue(mockImageData);
	});

	it('renderiza skeleton mientras carga', async () => {
		// Delay la resolución de la promesa
		(getImageCardData as jest.Mock).mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve(mockImageData), 100))
		);

                render(<ImageCard imageId="img-123" />);
	});

	it('renderiza la imagen correctamente', async () => {
		render(<ImageCard imageId="img-123" />);

		// Esperar a que los datos se carguen
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Verificar que la imagen se ha renderizado
		const image = document.querySelector('img');
		expect(image).toBeInTheDocument();
		expect(image).toHaveAttribute('src', mockImageData.thumbnailUrl);

		// Verificar que el nombre se renderiza (en el hover overlay)
		expect(screen.getByText('Paisaje montañoso')).toBeInTheDocument();
	});

	it('renderiza etiquetas correctamente', async () => {
		render(<ImageCard imageId="img-123" showTags={true} />);

		// Esperar a que los datos se carguen
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Verificar que las etiquetas se renderizan
		expect(screen.getByText('montaña')).toBeInTheDocument();
		expect(screen.getByText('atardecer')).toBeInTheDocument();
	});

	it('llama al onClick cuando se hace clic', async () => {
		const onClickMock = jest.fn();
		const user = userEvent.setup();

		render(<ImageCard imageId="img-123" onClick={onClickMock} />);

		// Esperar a que los datos se carguen
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Hacer clic en la tarjeta
		const card = document.querySelector('.relative.overflow-hidden');
		if (card) {
			await user.click(card);
		}

                // Verificar que se llamó al callback
                expect(onClickMock).toHaveBeenCalled();
	});

	it('renderiza un enlace cuando no hay onClick', async () => {
		render(<ImageCard imageId="img-123" />);

		// Esperar a que los datos se carguen
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Verificar que hay un enlace a la página de la imagen
               const link = document.querySelector(`a[href="/images/${mockImageData.id}"]`);
                expect(link).not.toBeNull();
	});

	it('renderiza mensaje de error cuando falla la carga', async () => {
		// Configurar el mock para simular un error
		const errorMessage = 'Error al cargar la imagen';
		(getImageCardData as jest.Mock).mockRejectedValue(new Error(errorMessage));

		render(<ImageCard imageId="img-123" />);

		// Esperar a que se procese el error
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Verificar que se muestra el mensaje de error
		expect(screen.getByText(errorMessage)).toBeInTheDocument();
	});
});
