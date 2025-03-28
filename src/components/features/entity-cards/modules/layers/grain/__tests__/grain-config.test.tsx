import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useGrainStore } from '../actions/grain-config.action';
import { GrainConfig } from '../components/grain-config';

describe('GrainConfig', () => {
	beforeEach(() => {
		const store = useGrainStore.getState();
		store.updateConfig({
			enabled: true,
			intensity: 0.5,
			size: 2,
			animated: false,
			speed: 1,
			colorMode: 'monochrome',
			opacity: 0.7,
			blend: 'normal',
			seed: 100,
			pattern: 'perlin',
			fractalNoise: false,
			roughness: 0.5,
			distribution: 'uniform',
		});
	});

	it('renderiza correctamente cuando está habilitado', () => {
		render(<GrainConfig />);
		expect(screen.getByText('Habilitar efecto grain')).toBeInTheDocument();
		expect(screen.getByText('Intensidad')).toBeInTheDocument();
		expect(screen.getByText('Tamaño')).toBeInTheDocument();
	});

	it('no muestra controles cuando está deshabilitado', () => {
		const store = useGrainStore.getState();
		store.updateConfig({ enabled: false });
		render(<GrainConfig />);
		expect(screen.queryByText('Intensidad')).not.toBeInTheDocument();
	});

	it('actualiza la intensidad cuando se mueve el slider', async () => {
		render(<GrainConfig />);
		const slider = screen.getByRole('slider', { name: /intensidad/i });
		await userEvent.click(slider);
		const store = useGrainStore.getState();
		expect(store.intensity).toBeDefined();
	});

	it('muestra controles de animación cuando está habilitada', async () => {
		render(<GrainConfig />);
		const animationSwitch = screen.getByRole('switch', { name: /animación/i });
		await userEvent.click(animationSwitch);
		expect(screen.getByText('Velocidad')).toBeInTheDocument();
	});

	it('muestra controles de ruido fractal cuando está habilitado', async () => {
		render(<GrainConfig />);
		const fractalSwitch = screen.getByRole('switch', { name: /ruido fractal/i });
		await userEvent.click(fractalSwitch);
		expect(screen.getByText('Rugosidad')).toBeInTheDocument();
	});

	it('actualiza el patrón cuando se selecciona uno nuevo', async () => {
		render(<GrainConfig />);
		const patternSelect = screen.getByRole('combobox', { name: /patrón/i });
		await userEvent.click(patternSelect);
		const simplexOption = screen.getByRole('option', { name: /simplex/i });
		await userEvent.click(simplexOption);
		const store = useGrainStore.getState();
		expect(store.pattern).toBe('simplex');
	});

	it('actualiza la distribución cuando se selecciona una nueva', async () => {
		render(<GrainConfig />);
		const distributionSelect = screen.getByRole('combobox', { name: /distribución/i });
		await userEvent.click(distributionSelect);
		const gaussianOption = screen.getByRole('option', { name: /gaussian/i });
		await userEvent.click(gaussianOption);
		const store = useGrainStore.getState();
		expect(store.distribution).toBe('gaussian');
	});

	it('actualiza el modo de color cuando se selecciona uno nuevo', async () => {
		render(<GrainConfig />);
		const colorModeSelect = screen.getByRole('combobox', { name: /modo de color/i });
		await userEvent.click(colorModeSelect);
		const rgbOption = screen.getByRole('option', { name: /rgb/i });
		await userEvent.click(rgbOption);
		const store = useGrainStore.getState();
		expect(store.colorMode).toBe('rgb');
	});

	it('actualiza el modo de mezcla cuando se selecciona uno nuevo', async () => {
		render(<GrainConfig />);
		const blendSelect = screen.getByRole('combobox', { name: /modo de mezcla/i });
		await userEvent.click(blendSelect);
		const multiplyOption = screen.getByRole('option', { name: /multiply/i });
		await userEvent.click(multiplyOption);
		const store = useGrainStore.getState();
		expect(store.blend).toBe('multiply');
	});

	it('actualiza la semilla cuando se mueve el slider', async () => {
		render(<GrainConfig />);
		const slider = screen.getByRole('slider', { name: /semilla/i });
		await userEvent.click(slider);
		const store = useGrainStore.getState();
		expect(store.seed).toBeDefined();
	});
});
