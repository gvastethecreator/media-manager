import { fireEvent, render, screen } from '@testing-library/react';
import { useGlitchStore } from '../../actions/glitch-config.action';
import { GlitchConfig } from '../glitch-config';

// Mock del store
jest.mock('../../actions/glitch-config.action', () => ({
	useGlitchStore: jest.fn(),
	glitchConfigSchema: jest.fn(),
}));

describe('GlitchConfig', () => {
	const mockConfig = {
		enabled: true,
		intensity: 0.5,
		frequency: 0.3,
		animated: false,
		speed: 1,
		colorShift: true,
		colorShiftAmount: 0.2,
		scanlines: true,
		scanlinesCount: 50,
		scanlinesOpacity: 0.5,
		noise: true,
		noiseIntensity: 0.3,
		distortion: true,
		distortionAmount: 0.4,
		chromatic: true,
		chromaticOffset: 0.2,
		blend: 'normal',
		layerIndex: 1,
	};

	const mockUpdateConfig = jest.fn();
	const mockResetConfig = jest.fn();

	beforeEach(() => {
		(useGlitchStore as jest.Mock).mockReturnValue({
			config: mockConfig,
			updateConfig: mockUpdateConfig,
			resetConfig: mockResetConfig,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renderiza los controles correctamente', () => {
		render(<GlitchConfig />);
		expect(screen.getByText('Habilitar Glitch')).toBeInTheDocument();
		expect(screen.getByText('Intensidad')).toBeInTheDocument();
		expect(screen.getByText('Frecuencia')).toBeInTheDocument();
	});

	it('muestra los controles de animación cuando está habilitado', () => {
		render(<GlitchConfig />);
		const animatedCheckbox = screen.getByLabelText('Animar');
		fireEvent.click(animatedCheckbox);
		expect(screen.getByText('Velocidad')).toBeInTheDocument();
	});

	it('muestra los controles de color cuando el desplazamiento de color está habilitado', () => {
		render(<GlitchConfig />);
		const colorShiftCheckbox = screen.getByLabelText('Desplazamiento de Color');
		fireEvent.click(colorShiftCheckbox);
		expect(screen.getByText('Cantidad de Desplazamiento')).toBeInTheDocument();
	});

	it('muestra los controles de líneas de escaneo cuando están habilitadas', () => {
		render(<GlitchConfig />);
		const scanlinesCheckbox = screen.getByLabelText('Líneas de Escaneo');
		fireEvent.click(scanlinesCheckbox);
		expect(screen.getByText('Cantidad de Líneas')).toBeInTheDocument();
		expect(screen.getByText('Opacidad de Líneas')).toBeInTheDocument();
	});

	it('muestra los controles de ruido cuando está habilitado', () => {
		render(<GlitchConfig />);
		const noiseCheckbox = screen.getByLabelText('Ruido');
		fireEvent.click(noiseCheckbox);
		expect(screen.getByText('Intensidad del Ruido')).toBeInTheDocument();
	});

	it('muestra los controles de distorsión cuando está habilitada', () => {
		render(<GlitchConfig />);
		const distortionCheckbox = screen.getByLabelText('Distorsión');
		fireEvent.click(distortionCheckbox);
		expect(screen.getByText('Cantidad de Distorsión')).toBeInTheDocument();
	});

	it('muestra los controles de aberración cromática cuando está habilitada', () => {
		render(<GlitchConfig />);
		const chromaticCheckbox = screen.getByLabelText('Aberración Cromática');
		fireEvent.click(chromaticCheckbox);
		expect(screen.getByText('Desplazamiento Cromático')).toBeInTheDocument();
	});

	it('actualiza la configuración cuando cambian los controles', () => {
		render(<GlitchConfig />);
		const intensitySlider = screen.getByLabelText('Intensidad');
		fireEvent.change(intensitySlider, { target: { value: 0.7 } });
		expect(mockUpdateConfig).toHaveBeenCalled();
	});

	it('restablece la configuración cuando se hace clic en el botón de restablecer', () => {
		render(<GlitchConfig />);
		const resetButton = screen.getByText('Restablecer');
		fireEvent.click(resetButton);
		expect(mockResetConfig).toHaveBeenCalled();
	});

	it('muestra el selector de modo de mezcla con las opciones correctas', () => {
		render(<GlitchConfig />);
		const blendModeSelect = screen.getByLabelText('Modo de Mezcla');
		fireEvent.click(blendModeSelect);
		expect(screen.getByText('Normal')).toBeInTheDocument();
		expect(screen.getByText('Multiplicar')).toBeInTheDocument();
		expect(screen.getByText('Pantalla')).toBeInTheDocument();
		expect(screen.getByText('Superponer')).toBeInTheDocument();
		expect(screen.getByText('Color Dodge')).toBeInTheDocument();
	});

	it('muestra el control de índice de capa con la descripción correcta', () => {
		render(<GlitchConfig />);
		expect(screen.getByText('Índice de Capa')).toBeInTheDocument();
		expect(screen.getByText('Controla el orden de las capas en modo explotado')).toBeInTheDocument();
	});

	it('oculta todos los controles cuando el efecto está deshabilitado', () => {
		(useGlitchStore as jest.Mock).mockReturnValue({
			config: { ...mockConfig, enabled: false },
			updateConfig: mockUpdateConfig,
			resetConfig: mockResetConfig,
		});
		render(<GlitchConfig />);
		expect(screen.queryByText('Intensidad')).not.toBeInTheDocument();
		expect(screen.queryByText('Frecuencia')).not.toBeInTheDocument();
	});
});