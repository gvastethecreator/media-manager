import { render, screen } from '@testing-library/react';
import { useGrainStore } from '../actions/grain-config.action';
import { GrainLayer } from '../components/grain-layer';

// Mock de Canvas y Context2D
const mockContext = {
	createImageData: jest.fn(() => ({
		data: new Uint8ClampedArray(100),
		width: 10,
		height: 10,
	})),
	putImageData: jest.fn(),
	clearRect: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

describe('GrainLayer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		const store = useGrainStore.getState();
		store.updateConfig({ enabled: true });
	});

	it('renderiza correctamente cuando está habilitado', () => {
		render(<GrainLayer width={300} height={400} />);
		const canvas = screen.getByRole('presentation');
		expect(canvas).toBeInTheDocument();
		expect(canvas).toHaveStyle({ width: '300px', height: '400px' });
	});

	it('no renderiza cuando está deshabilitado', () => {
		const store = useGrainStore.getState();
		store.updateConfig({ enabled: false });
		render(<GrainLayer width={300} height={400} />);
		expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
	});

	it('aplica la clase de capa explotada cuando isExploded es true', () => {
		render(<GrainLayer width={300} height={400} isExploded={true} />);
		const canvas = screen.getByRole('presentation');
		expect(canvas).toHaveClass('exploded-layer', 'layer-grain');
	});

	it('aplica la clase de capa activa cuando es la capa activa', () => {
		render(<GrainLayer width={300} height={400} activeLayer="grain" />);
		const canvas = screen.getByRole('presentation');
		expect(canvas).toHaveClass('active-layer');
	});

	it('inicia la animación cuando está configurada', () => {
		const store = useGrainStore.getState();
		store.updateConfig({ animated: true });
		render(<GrainLayer width={300} height={400} />);
		expect(global.requestAnimationFrame).toHaveBeenCalled();
	});

	it('limpia los recursos al desmontar', () => {
		const { unmount } = render(<GrainLayer width={300} height={400} />);
		unmount();
		expect(global.cancelAnimationFrame).toHaveBeenCalled();
	});

	it('actualiza el patrón cuando cambia la configuración', () => {
		const { rerender } = render(<GrainLayer width={300} height={400} />);
		expect(mockContext.putImageData).toHaveBeenCalledTimes(1);

		const store = useGrainStore.getState();
		store.updateConfig({ pattern: 'simplex' });
		rerender(<GrainLayer width={300} height={400} />);
		expect(mockContext.putImageData).toHaveBeenCalledTimes(2);
	});

	it('ajusta la opacidad según el estado de hover', () => {
		const { rerender } = render(<GrainLayer width={300} height={400} />);
		let canvas = screen.getByRole('presentation');
		const initialOpacity = canvas.style.opacity;

		rerender(<GrainLayer width={300} height={400} isHovered={true} />);
		canvas = screen.getByRole('presentation');
		const hoveredOpacity = canvas.style.opacity;

		expect(Number.parseFloat(hoveredOpacity)).toBeGreaterThan(Number.parseFloat(initialOpacity));
	});

	it('aplica el modo de mezcla correcto', () => {
		const store = useGrainStore.getState();
		store.updateConfig({ blend: 'multiply' });
		render(<GrainLayer width={300} height={400} />);
		const canvas = screen.getByRole('presentation');
		expect(canvas).toHaveClass('mix-blend-multiply');
	});
});