import { fireEvent, render, screen } from '@testing-library/react';
import { EntityCard } from '../../EntityCard';
import { definePreset } from '../../presets';
import { EntityCardProvider } from '../../providers/EntityCardProvider';
import { usePresetSystem } from '../hooks/usePresetSystem';
import { RegisterLayers } from '../register-layers';

// 🎨 Mock de capas para pruebas
const MockVisualLayer = {
	id: 'visual-layer',
	name: 'Visual Layer',
	type: 'visual',
	Component: ({ enabled, config }) => (
		enabled ? <div data-testid="visual-layer">{config?.style || 'Default'}</div> : null
	)
};

const MockEffectLayer = {
	id: 'effect-layer',
	name: 'Effect Layer',
	type: 'effect',
	Component: ({ enabled, config }) => (
		enabled ? <div data-testid="effect-layer">{config?.intensity || '0'}</div> : null
	)
};

// 🎭 Presets de prueba
const legendaryPreset = definePreset({
	id: 'legendary',
	name: 'Legendario',
	layers: {
		'visual-layer': {
			enabled: true,
			config: { style: 'Legendary' }
		},
		'effect-layer': {
			enabled: true,
			config: { intensity: '100' }
		}
	}
});

const rarePreset = definePreset({
	id: 'rare',
	name: 'Raro',
	layers: {
		'visual-layer': {
			enabled: true,
			config: { style: 'Rare' }
		},
		'effect-layer': {
			enabled: true,
			config: { intensity: '50' }
		}
	}
});

// 🧪 Componente de prueba para el hook usePresetSystem
function TestPresetComponent() {
	const { activePreset, applyPreset, removePreset } = usePresetSystem();

	return (
		<div>
			<button
				type="button"
				onClick={() => applyPreset(legendaryPreset)}
				data-testid="apply-legendary"
			>
				Apply Legendary
			</button>
			<button
				type="button"
				onClick={() => applyPreset(rarePreset)}
				data-testid="apply-rare"
			>
				Apply Rare
			</button>
			<button
				type="button"
				onClick={() => removePreset()}
				data-testid="remove-preset"
			>
				Remove Preset
			</button>
			<pre data-testid="active-preset">
				{JSON.stringify(activePreset)}
			</pre>
		</div>
	);
}

// 📚 Suite de pruebas principal
describe('Preset System', () => {
	// 🎯 Pruebas básicas de presets
	describe('Basic Preset Functionality', () => {
		it('should apply preset correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={legendaryPreset}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('visual-layer')).toHaveTextContent('Legendary');
			expect(screen.getByTestId('effect-layer')).toHaveTextContent('100');
		});

		it('should handle preset changes', () => {
			const { rerender } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={legendaryPreset}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('visual-layer')).toHaveTextContent('Legendary');

			rerender(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={rarePreset}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('visual-layer')).toHaveTextContent('Rare');
		});
	});

	// 🔄 Pruebas de gestión de estado de presets
	describe('Preset State Management', () => {
		it('should manage preset state correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<TestPresetComponent />
				</EntityCardProvider>
			);

			fireEvent.click(screen.getByTestId('apply-legendary'));
			expect(screen.getByTestId('active-preset')).toHaveTextContent('legendary');

			fireEvent.click(screen.getByTestId('apply-rare'));
			expect(screen.getByTestId('active-preset')).toHaveTextContent('rare');

			fireEvent.click(screen.getByTestId('remove-preset'));
			expect(screen.getByTestId('active-preset')).toHaveTextContent('');
		});
	});

	// 🎨 Pruebas de combinación de presets y configuraciones
	describe('Preset and Configuration Combination', () => {
		it('should allow overriding preset configurations', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={legendaryPreset}
						layers={{
							'visual-layer': {
								enabled: true,
								config: { style: 'Custom' }
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('visual-layer')).toHaveTextContent('Custom');
			expect(screen.getByTestId('effect-layer')).toHaveTextContent('100');
		});

		it('should handle partial preset overrides', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={legendaryPreset}
						layers={{
							'effect-layer': {
								enabled: false
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('visual-layer')).toHaveTextContent('Legendary');
			expect(screen.queryByTestId('effect-layer')).not.toBeInTheDocument();
		});
	});

	// 🔒 Pruebas de validación de presets
	describe('Preset Validation', () => {
		it('should handle invalid preset configurations gracefully', () => {
			const invalidPreset = definePreset({
				id: 'invalid',
				name: 'Invalid',
				layers: {
					'non-existent-layer': {
						enabled: true
					}
				}
			});

			const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={invalidPreset}
					/>
				</EntityCardProvider>
			);

			expect(consoleError).not.toHaveBeenCalled();
			consoleError.mockRestore();
		});
	});

	// 🎮 Pruebas de interactividad con presets
	describe('Preset Interactivity', () => {
		const InteractiveLayer = {
			id: 'interactive-layer',
			name: 'Interactive Layer',
			type: 'interactive',
			Component: ({ enabled, config, onInteraction }) => (
				enabled ? (
					<button
						type="button"
						data-testid="interactive-layer"
						onClick={() => onInteraction?.(config?.action || 'default')}
					>
						Interactive
					</button>
				) : null
			)
		};

		const interactivePreset = definePreset({
			id: 'interactive',
			name: 'Interactive',
			layers: {
				'interactive-layer': {
					enabled: true,
					config: { action: 'custom' }
				}
			}
		});

		it('should handle preset interactions correctly', () => {
			const onInteraction = jest.fn();

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[InteractiveLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={interactivePreset}
						layers={{
							'interactive-layer': {
								onInteraction
							}
						}}
					/>
				</EntityCardProvider>
			);

			fireEvent.click(screen.getByTestId('interactive-layer'));
			expect(onInteraction).toHaveBeenCalledWith('custom');
		});
	});

	// 🔄 Pruebas de ciclo de vida de presets
	describe('Preset Lifecycle', () => {
		it('should clean up preset state on unmount', () => {
			const { unmount } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<TestPresetComponent />
				</EntityCardProvider>
			);

			fireEvent.click(screen.getByTestId('apply-legendary'));
			expect(screen.getByTestId('active-preset')).toHaveTextContent('legendary');

			unmount();

			// Re-renderizar para verificar que el estado se limpió
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<TestPresetComponent />
				</EntityCardProvider>
			);

			expect(screen.getByTestId('active-preset')).not.toHaveTextContent('legendary');
		});
	});

	// 🎨 Pruebas de herencia de presets
	describe('Preset Inheritance', () => {
		const basePreset = definePreset({
			id: 'base',
			name: 'Base',
			layers: {
				'visual-layer': {
					enabled: true,
					config: { style: 'Base' }
				}
			}
		});

		const extendedPreset = definePreset({
			id: 'extended',
			name: 'Extended',
			extends: 'base',
			layers: {
				'effect-layer': {
					enabled: true,
					config: { intensity: '75' }
				}
			}
		});

		it('should handle preset inheritance correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockVisualLayer, MockEffectLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={extendedPreset}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('visual-layer')).toHaveTextContent('Base');
			expect(screen.getByTestId('effect-layer')).toHaveTextContent('75');
		});
	});
});