import { fireEvent, render, screen } from '@testing-library/react';
import { usePixelateStore } from '../actions/pixelate-config.action';
import { PixelateConfig } from '../components/pixelate-config';
import { PixelateLayer } from '../components/pixelate-layer';

// Mock de Canvas y Context2D
const mockContext = {
	drawImage: jest.fn(),
	getImageData: jest.fn(() => ({
		data: new Uint8ClampedArray(100),
		width: 10,
		height: 10,
	})),
	putImageData: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

// Mock de Image
const mockImage = {
	onload: jest.fn(),
	src: '',
	crossOrigin: '',
};

global.Image = jest.fn(() => mockImage) as any;

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

describe('PixelateLayer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		const store = usePixelateStore.getState();
		store.updateConfig({ enabled: true });
	});

	it('renderiza correctamente cuando está habilitado', () => {
		render(
			<PixelateLayer
				width={300}
				height={400}
				sourceImage="test.jpg"
			/>
		);
		const canvas = screen.getAllByRole('presentation');
		expect(canvas).toHaveLength(2); // Canvas fuente y destino
		expect(canvas[1]).toHaveStyle({ width: '300px', height: '400px' });
	});

	it('no renderiza cuando está deshabilitado', () => {
		const store = usePixelateStore.getState();
		store.updateConfig({ enabled: false });
		render(
			<PixelateLayer
				width={300}
				height={400}
				sourceImage="test.jpg"
			/>
		);
		expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
	});

	it('carga la imagen correctamente', () => {
		render(
			<PixelateLayer
				width={300}
				height={400}
				sourceImage="test.jpg"
			/>
		);
		expect(mockImage.crossOrigin).toBe('anonymous');
		expect(mockImage.src).toBe('test.jpg');
	});

	it('inicia la animación cuando está configurada', () => {
		const store = usePixelateStore.getState();
		store.updateConfig({ animated: true });
		render(
			<PixelateLayer
				width={300}
				height={400}
				sourceImage="test.jpg"
			/>
		);
		expect(global.requestAnimationFrame).toHaveBeenCalled();
	});

	it('limpia los recursos al desmontar', () => {
		const { unmount } = render(
			<PixelateLayer
				width={300}
				height={400}
				sourceImage="test.jpg"
			/>
		);
		unmount();
		expect(global.cancelAnimationFrame).toHaveBeenCalled();
	});
});

describe('PixelateConfig', () => {
	it('renderiza los controles correctamente', () => {
		render(<PixelateConfig />);
		expect(screen.getByText('Habilitado')).toBeInTheDocument();
		expect(screen.getByText('Tamaño de píxel')).toBeInTheDocument();
		expect(screen.getByText('Opacidad')).toBeInTheDocument();
		expect(screen.getByText('Modo de mezcla')).toBeInTheDocument();
	});

	it('muestra controles de animación cuando está habilitada', () => {
		const store = usePixelateStore.getState();
		store.updateConfig({ animated: true });
		render(<PixelateConfig />);
		expect(screen.getByText('Velocidad de animación')).toBeInTheDocument();
		expect(screen.getByText('Patrón de animación')).toBeInTheDocument();
	});

	it('muestra controles de color cuando la cuantización está habilitada', () => {
		const store = usePixelateStore.getState();
		store.updateConfig({ colorQuantization: true });
		render(<PixelateConfig />);
		expect(screen.getByText('Niveles de color')).toBeInTheDocument();
	});

	it('muestra controles de borde cuando la detección está habilitada', () => {
		const store = usePixelateStore.getState();
		store.updateConfig({ edgeDetection: true });
		render(<PixelateConfig />);
		expect(screen.getByText('Umbral')).toBeInTheDocument();
		expect(screen.getByText('Grosor de borde')).toBeInTheDocument();
	});

	it('actualiza la configuración al cambiar los controles', () => {
		render(<PixelateConfig />);
		const enabledSwitch = screen.getByRole('switch');
		fireEvent.click(enabledSwitch);

		const store = usePixelateStore.getState();
		expect(store.config.enabled).toBe(false);
	});

	it('muestra controles de glitch cuando la intensidad es mayor que 0', () => {
		const store = usePixelateStore.getState();
		store.updateConfig({ glitchIntensity: 0.5 });
		render(<PixelateConfig />);
		expect(screen.getByText('Frecuencia de glitch')).toBeInTheDocument();
	});
});