import { render, screen } from '@testing-library/react';
import { EntityCardProvider } from '../../providers/EntityCardProvider';
import { RegisterLayers } from '../register-layers';
import { EntityCard } from '../../EntityCard';
import { HolographicLayerPlugin } from '../visual/HolographicLayer';

// 🧪 Suite de pruebas principal
describe('Holographic Layer', () => {
	// 🧪 Pruebas de renderizado básico
	describe('Basic Rendering', () => {
		it('should render when enabled', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
							},
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('holographic-layer')).toBeInTheDocument();
		});

		it('should not render when disabled', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: false,
							},
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.queryByTestId('holographic-layer')).not.toBeInTheDocument();
		});
	});

	// 🧪 Pruebas de configuración
	describe('Configuration', () => {
		it('should apply custom color configuration', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									color: '#ff0000',
									glowColor: '#ff0000',
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			const hologramBase = screen.getByTestId('holographic-layer').querySelector('.hologram-base');
			expect(hologramBase).toHaveStyle({
				background: expect.stringContaining('#ff0000'),
			});
		});

		it('should apply custom pattern configuration', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									pattern: 'grid',
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('holographic-layer')).toHaveClass('pattern-grid');
		});

		it('should apply custom intensity configuration', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									intensity: 0.8,
									glowIntensity: 0.8,
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			const hologramBase = screen.getByTestId('holographic-layer').querySelector('.hologram-base');
			expect(hologramBase).toHaveStyle({
				background: expect.stringContaining('cc'), // ~0.8 * 255 = 204 (cc en hex)
			});
		});
	});

	// 🧪 Pruebas de efectos
	describe('Effects', () => {
		it('should render scanline effect', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									scanlineSpeed: 2,
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			const scanline = screen.getByTestId('holographic-layer').querySelector('.scanline');
			expect(scanline).toBeInTheDocument();
		});

		it('should render noise effect', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									noiseIntensity: 0.5,
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			const noise = screen.getByTestId('holographic-layer').querySelector('.noise');
			expect(noise).toBeInTheDocument();
			expect(noise).toHaveStyle({ opacity: 0.5 });
		});

		it('should render glow effect', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									glowColor: '#00ff00',
									glowIntensity: 0.7,
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			const glow = screen.getByTestId('holographic-layer').querySelector('.glow');
			expect(glow).toBeInTheDocument();
			expect(glow).toHaveStyle({
				boxShadow: expect.stringContaining('#00ff00'),
			});
		});
	});

	// 🧪 Pruebas de animación
	describe('Animations', () => {
		it('should apply flicker animation when enabled', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									enableFlicker: true,
									flickerFrequency: 4,
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			const hologramBase = screen.getByTestId('holographic-layer').querySelector('.hologram-base');
			expect(hologramBase).toHaveAttribute('style', expect.stringContaining('animation'));
		});

		it('should not apply flicker animation when disabled', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									enableFlicker: false,
								},
							},
						}}
					/>
				</EntityCardProvider>
			);

			const hologramBase = screen.getByTestId('holographic-layer').querySelector('.hologram-base');
			expect(hologramBase).not.toHaveAttribute('style', expect.stringContaining('animation'));
		});
	});

	// 🧪 Pruebas de composición
	describe('Composition', () => {
		it('should render children content', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
							},
						}}
					>
						<div data-testid="child-content">Test Content</div>
					</EntityCard>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('child-content')).toBeInTheDocument();
			expect(screen.getByText('Test Content')).toBeInTheDocument();
		});

		it('should maintain children visibility with effects', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HolographicLayerPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'holographic-layer': {
								enabled: true,
								config: {
									intensity: 1,
									noiseIntensity: 1,
									glowIntensity: 1,
								},
							},
						}}
					>
						<div data-testid="child-content">Test Content</div>
					</EntityCard>
				</EntityCardProvider>
			);

			const childContent = screen.getByTestId('child-content');
			expect(childContent).toBeVisible();
		});
	});
});
