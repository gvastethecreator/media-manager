import { act, fireEvent, render, screen } from '@testing-library/react';
import { EntityCard } from '../../EntityCard';
import { definePreset } from '../../presets';
import { EntityCardProvider } from '../../providers/EntityCardProvider';
import { useLayerPlugin } from '../hooks/useLayerPlugin';
import { RegisterLayers } from '../register-layers';

// 🧪 Mock de una capa personalizada para pruebas
const MockLayer = {
	id: 'mock-layer',
	name: 'Mock Layer',
	type: 'visual',
	Component: ({ enabled, config }) => (
		enabled ? <div data-testid="mock-layer">{config?.text || 'Mock'}</div> : null
	)
};

// 🎭 Mock de un preset para pruebas
const mockPreset = definePreset({
	id: 'test-preset',
	name: 'Test Preset',
	layers: {
		'mock-layer': {
			enabled: true,
			config: {
				text: 'Preset Text'
			}
		}
	}
});

// 🧪 Componente de prueba que usa el hook useLayerPlugin
function TestComponent() {
	const { layers, updateLayer } = useLayerPlugin();
	return (
		<div>
			<button
				type="button"
				onClick={() => updateLayer('mock-layer', { enabled: true })}
				data-testid="enable-button"
			>
				Enable Layer
			</button>
			<pre data-testid="layers-state">{JSON.stringify(layers)}</pre>
		</div>
	);
}

// 📚 Suite de pruebas principal
describe('Layer System', () => {
	// 🔍 Pruebas del registro de capas
	describe('Layer Registration', () => {
		it('should register a layer successfully', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<TestComponent />
				</EntityCardProvider>
			);

			expect(screen.getByTestId('layers-state')).toHaveTextContent('mock-layer');
		});

		it('should handle multiple layer registrations', () => {
			const SecondMockLayer = { ...MockLayer, id: 'second-mock-layer' };

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer, SecondMockLayer]} />
					<TestComponent />
				</EntityCardProvider>
			);

			const state = screen.getByTestId('layers-state');
			expect(state).toHaveTextContent('mock-layer');
			expect(state).toHaveTextContent('second-mock-layer');
		});
	});

	// 🎛️ Pruebas de la gestión del estado de las capas
	describe('Layer State Management', () => {
		it('should update layer state correctly', async () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<TestComponent />
				</EntityCardProvider>
			);

			const enableButton = screen.getByTestId('enable-button');
			await act(() => {
				fireEvent.click(enableButton);
			});

			const state = screen.getByTestId('layers-state');
			expect(state).toHaveTextContent('"enabled":true');
		});

		it('should maintain layer state between renders', () => {
			const { rerender } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<TestComponent />
				</EntityCardProvider>
			);

			// Actualizar el estado
			act(() => {
				fireEvent.click(screen.getByTestId('enable-button'));
			});

			// Re-renderizar
			rerender(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<TestComponent />
				</EntityCardProvider>
			);

			expect(screen.getByTestId('layers-state')).toHaveTextContent('"enabled":true');
		});
	});

	// 🎨 Pruebas de renderizado de capas
	describe('Layer Rendering', () => {
		it('should render enabled layers', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'mock-layer': {
								enabled: true,
								config: { text: 'Test Text' }
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-layer')).toHaveTextContent('Test Text');
		});

		it('should not render disabled layers', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'mock-layer': {
								enabled: false
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.queryByTestId('mock-layer')).not.toBeInTheDocument();
		});
	});

	// 🎯 Pruebas del sistema de presets
	describe('Preset System', () => {
		it('should apply preset configurations correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={mockPreset}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-layer')).toHaveTextContent('Preset Text');
		});

		it('should allow overriding preset configurations', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						preset={mockPreset}
						layers={{
							'mock-layer': {
								enabled: true,
								config: { text: 'Override Text' }
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-layer')).toHaveTextContent('Override Text');
		});
	});

	// 🔄 Pruebas de actualización dinámica
	describe('Dynamic Updates', () => {
		it('should handle dynamic layer updates', async () => {
			const { rerender } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'mock-layer': {
								enabled: true,
								config: { text: 'Initial Text' }
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-layer')).toHaveTextContent('Initial Text');

			// Actualizar la configuración
			rerender(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'mock-layer': {
								enabled: true,
								config: { text: 'Updated Text' }
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-layer')).toHaveTextContent('Updated Text');
		});
	});

	// 🏷️ Pruebas de tipos de capas
	describe('Layer Types', () => {
		const StructuralLayer = {
			...MockLayer,
			id: 'structural-layer',
			type: 'structural'
		};

		const VisualLayer = {
			...MockLayer,
			id: 'visual-layer',
			type: 'visual'
		};

		const InteractiveLayer = {
			...MockLayer,
			id: 'interactive-layer',
			type: 'interactive'
		};

		it('should handle different layer types correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers
						initialLayers={[StructuralLayer, VisualLayer, InteractiveLayer]}
					/>
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'structural-layer': { enabled: true },
							'visual-layer': { enabled: true },
							'interactive-layer': { enabled: true }
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getAllByTestId(/.*-layer/)).toHaveLength(3);
		});
	});

	// 🔒 Pruebas de validación
	describe('Validation', () => {
		it('should handle invalid layer configurations gracefully', () => {
			const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'mock-layer': {
								enabled: true,
								config: { invalidProp: 'Invalid' }
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-layer')).toBeInTheDocument();
			expect(consoleError).not.toHaveBeenCalled();

			consoleError.mockRestore();
		});

		it('should handle non-existent layers gracefully', () => {
			const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'non-existent-layer': {
								enabled: true
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(consoleError).not.toHaveBeenCalled();

			consoleError.mockRestore();
		});
	});

	// 🎮 Pruebas de interactividad
	describe('Layer Interactivity', () => {
		const InteractiveLayer = {
			...MockLayer,
			id: 'interactive-layer',
			Component: ({ enabled, config, onInteraction }) => (
				enabled ? (
					<button
						type="button"
						data-testid="interactive-layer"
						onClick={() => onInteraction?.('click')}
					>
						{config?.text || 'Interactive'}
					</button>
				) : null
			)
		};

		it('should handle layer interactions correctly', () => {
			const onInteraction = jest.fn();

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[InteractiveLayer]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'interactive-layer': {
								enabled: true,
								onInteraction
							}
						}}
					/>
				</EntityCardProvider>
			);

			fireEvent.click(screen.getByTestId('interactive-layer'));
			expect(onInteraction).toHaveBeenCalledWith('click');
		});
	});

	// 🔄 Pruebas de ciclo de vida
	describe('Lifecycle', () => {
		it('should clean up layers on unmount', () => {
			const { unmount } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<TestComponent />
				</EntityCardProvider>
			);

			unmount();

			// Re-renderizar para verificar que el estado se limpió
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[MockLayer]} />
					<TestComponent />
				</EntityCardProvider>
			);

			const state = screen.getByTestId('layers-state');
			expect(state).not.toHaveTextContent('"enabled":true');
		});
	});
});