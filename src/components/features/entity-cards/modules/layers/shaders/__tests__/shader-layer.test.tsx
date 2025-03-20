import { fireEvent, render, screen } from '@testing-library/react';
import { useShaderStore } from '../actions/shader-config.action';
import { ShaderConfig } from '../components/shader-config';
import { ShaderLayer } from '../components/shader-layer';

// Mock de WebGL
const mockWebGLContext = {
	createShader: jest.fn(() => ({})),
	shaderSource: jest.fn(),
	compileShader: jest.fn(),
	getShaderParameter: jest.fn(() => true),
	createProgram: jest.fn(() => ({})),
	attachShader: jest.fn(),
	linkProgram: jest.fn(),
	getProgramParameter: jest.fn(() => true),
	createBuffer: jest.fn(),
	bindBuffer: jest.fn(),
	bufferData: jest.fn(),
	getAttribLocation: jest.fn(),
	enableVertexAttribArray: jest.fn(),
	vertexAttribPointer: jest.fn(),
	useProgram: jest.fn(),
	getUniformLocation: jest.fn(),
	uniform1f: jest.fn(),
	uniform2f: jest.fn(),
	uniform3f: jest.fn(),
	clear: jest.fn(),
	drawArrays: jest.fn(),
	viewport: jest.fn(),
	deleteProgram: jest.fn(),
	deleteShader: jest.fn(),
};

// Mock del canvas y WebGL
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

describe('ShaderLayer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		const store = useShaderStore.getState();
		store.setActiveType('distortion');
		store.updateConfig('distortion', { enabled: true });
	});

	it('renderiza correctamente cuando está habilitado', () => {
		render(<ShaderLayer width={300} height={400} />);
		const canvas = screen.getByRole('presentation');
		expect(canvas).toBeInTheDocument();
		expect(canvas).toHaveStyle({ width: '300px', height: '400px' });
	});

	it('no renderiza cuando está deshabilitado', () => {
		const store = useShaderStore.getState();
		store.updateConfig('distortion', { enabled: false });
		render(<ShaderLayer width={300} height={400} />);
		expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
	});

	it('inicializa WebGL correctamente', () => {
		render(<ShaderLayer width={300} height={400} />);
		expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('webgl');
		expect(mockWebGLContext.createProgram).toHaveBeenCalled();
	});

	it('actualiza el viewport cuando cambian las dimensiones', () => {
		const { rerender } = render(<ShaderLayer width={300} height={400} />);
		expect(mockWebGLContext.viewport).toHaveBeenCalledWith(0, 0, 300, 400);

		rerender(<ShaderLayer width={400} height={500} />);
		expect(mockWebGLContext.viewport).toHaveBeenCalledWith(0, 0, 400, 500);
	});

	it('limpia los recursos al desmontar', () => {
		const { unmount } = render(<ShaderLayer width={300} height={400} />);
		unmount();
		expect(mockWebGLContext.deleteProgram).toHaveBeenCalled();
		expect(global.cancelAnimationFrame).toHaveBeenCalled();
	});
});

describe('ShaderConfig', () => {
	it('renderiza los controles correctamente', () => {
		render(<ShaderConfig />);
		expect(screen.getByText('Tipo de Shader')).toBeInTheDocument();
		expect(screen.getByText('Habilitado')).toBeInTheDocument();
		expect(screen.getByText('Opacidad')).toBeInTheDocument();
		expect(screen.getByText('Modo de mezcla')).toBeInTheDocument();
	});

	it('muestra controles específicos para el shader activo', () => {
		const store = useShaderStore.getState();
		store.setActiveType('distortion');
		render(<ShaderConfig />);
		expect(screen.getByText('Intensidad')).toBeInTheDocument();
	});

	it('actualiza la configuración al cambiar los controles', () => {
		render(<ShaderConfig />);
		const enabledSwitch = screen.getByRole('switch');
		fireEvent.click(enabledSwitch);

		const store = useShaderStore.getState();
		expect(store.configs.distortion.enabled).toBe(false);
	});

	it('cambia el tipo de shader activo', () => {
		render(<ShaderConfig />);
		const select = screen.getByRole('combobox');
		fireEvent.change(select, { target: { value: 'wave' } });

		const store = useShaderStore.getState();
		expect(store.activeType).toBe('wave');
	});
});