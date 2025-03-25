import { act, render, screen } from '@testing-library/react';
import { EntityCard } from '../../EntityCard';
import { useLayerPlugin } from '../../hooks/useLayerPlugin';
import { EntityCardProvider } from '../../providers/EntityCardProvider';
import { RegisterLayers } from '../register-layers';

// 🔌 Mock de Plugin de Capa
const createMockPlugin = (id: string) => ({
	id,
	name: `Mock Plugin ${id}`,
	type: 'visual',
	Component: ({ enabled, config }) => (
		enabled ? (
			<div
				data-testid={`mock-plugin-${id}`}
				style={{
					backgroundColor: config?.color || 'transparent',
					opacity: config?.opacity || 1
				}}
			>
				{config?.content}
			</div>
		) : null
	)
});

// 🎨 Plugin de Capa con Efectos
const EffectPlugin = {
	id: 'effect-plugin',
	name: 'Effect Plugin',
	type: 'visual',
	effects: {
		glow: (intensity: number) => ({
			boxShadow: `0 0 ${intensity}px rgba(255, 255, 255, 0.8)`
		}),
		blur: (amount: number) => ({
			filter: `blur(${amount}px)`
		})
	},
	Component: ({ enabled, config }) => {
		const styles = {
			...(config?.effects?.glow && EffectPlugin.effects.glow(config.effects.glow)),
			...(config?.effects?.blur && EffectPlugin.effects.blur(config.effects.blur))
		};

		return enabled ? (
			<div data-testid="effect-plugin" style={styles}>
				{config?.content}
			</div>
		) : null;
	}
};

// 🔄 Plugin de Capa con Estado
const StatefulPlugin = {
	id: 'stateful-plugin',
	name: 'Stateful Plugin',
	type: 'interactive',
	initialState: {
		clicks: 0,
		isActive: false
	},
	Component: ({ enabled, config, state, setState }) => {
		const handleClick = () => {
			setState(prev => ({
				...prev,
				clicks: prev.clicks + 1,
				isActive: !prev.isActive
			}));
		};

		return enabled ? (
			<div
				data-testid="stateful-plugin"
				onClick={handleClick}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						handleClick();
					}
				}}
				tabIndex={0}
				role="button"
				aria-label="Stateful plugin button"
				style={{
					backgroundColor: state?.isActive ? 'green' : 'red',
					cursor: 'pointer'
				}}
			>
				Clicks: {state?.clicks}
			</div>
		) : null;
	}
};

// 📚 Suite de Pruebas Principal
describe('Plugin System', () => {
	// 🔌 Pruebas de Registro de Plugins
	describe('Plugin Registration', () => {
		it('should register multiple plugins', () => {
			const plugin1 = createMockPlugin('1');
			const plugin2 = createMockPlugin('2');

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[plugin1, plugin2]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'1': { enabled: true },
							'2': { enabled: true }
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-plugin-1')).toBeInTheDocument();
			expect(screen.getByTestId('mock-plugin-2')).toBeInTheDocument();
		});

		it('should handle plugin dependencies', () => {
			const basePlugin = createMockPlugin('base');
			const dependentPlugin = {
				...createMockPlugin('dependent'),
				dependencies: ['base']
			};

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[basePlugin, dependentPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'base': { enabled: true },
							'dependent': { enabled: true }
						}}
					/>
				</EntityCardProvider>
			);

			expect(screen.getByTestId('mock-plugin-base')).toBeInTheDocument();
			expect(screen.getByTestId('mock-plugin-dependent')).toBeInTheDocument();
		});
	});

	// 🎨 Pruebas de Efectos de Plugin
	describe('Plugin Effects', () => {
		it('should apply plugin effects correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[EffectPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'effect-plugin': {
								enabled: true,
								config: {
									effects: {
										glow: 10,
										blur: 2
									}
								}
							}
						}}
					/>
				</EntityCardProvider>
			);

			const effectElement = screen.getByTestId('effect-plugin');
			expect(effectElement).toHaveStyle({
				boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
				filter: 'blur(2px)'
			});
		});
	});

	// 🔄 Pruebas de Estado de Plugin
	describe('Plugin State Management', () => {
		it('should manage plugin state correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[StatefulPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'stateful-plugin': {
								enabled: true
							}
						}}
					/>
				</EntityCardProvider>
			);

			const stateElement = screen.getByTestId('stateful-plugin');
			expect(stateElement).toHaveTextContent('Clicks: 0');
			expect(stateElement).toHaveStyle({ backgroundColor: 'red' });

			act(() => {
				stateElement.click();
			});

			expect(stateElement).toHaveTextContent('Clicks: 1');
			expect(stateElement).toHaveStyle({ backgroundColor: 'green' });
		});
	});

	// 🔄 Pruebas de Ciclo de Vida de Plugin
	describe('Plugin Lifecycle', () => {
		it('should handle plugin lifecycle events', () => {
			const lifecycleEvents: string[] = [];

			const LifecyclePlugin = {
				id: 'lifecycle',
				name: 'Lifecycle Plugin',
				type: 'visual',
				onMount: () => {
					lifecycleEvents.push('mounted');
				},
				onUnmount: () => {
					lifecycleEvents.push('unmounted');
				},
				Component: ({ enabled }) => (
					enabled ? <div data-testid="lifecycle-plugin" /> : null
				)
			};

			const { unmount } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[LifecyclePlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'lifecycle': { enabled: true }
						}}
					/>
				</EntityCardProvider>
			);

			expect(lifecycleEvents).toContain('mounted');

			unmount();

			expect(lifecycleEvents).toContain('unmounted');
		});
	});

	// 🔄 Pruebas de Actualización Dinámica
	describe('Dynamic Updates', () => {
		it('should handle dynamic plugin updates', () => {
			const DynamicPlugin = {
				id: 'dynamic',
				name: 'Dynamic Plugin',
				type: 'visual',
				Component: ({ enabled, config }) => (
					enabled ? (
						<div
							data-testid="dynamic-plugin"
							style={{ transform: `scale(${config?.scale || 1})` }}
						/>
					) : null
				)
			};

			const { rerender } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[DynamicPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'dynamic': {
								enabled: true,
								config: { scale: 1 }
							}
						}}
					/>
				</EntityCardProvider>
			);

			const dynamicElement = screen.getByTestId('dynamic-plugin');
			expect(dynamicElement).toHaveStyle({ transform: 'scale(1)' });

			rerender(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[DynamicPlugin]} />
					<EntityCard
						entityId="test"
						entityType="test"
						layers={{
							'dynamic': {
								enabled: true,
								config: { scale: 2 }
							}
						}}
					/>
				</EntityCardProvider>
			);

			expect(dynamicElement).toHaveStyle({ transform: 'scale(2)' });
		});
	});

	// 🛠️ Pruebas de Utilidades de Plugin
	describe('Plugin Utilities', () => {
		const TestComponent = () => {
			const { registerPlugin, unregisterPlugin, getPlugin } = useLayerPlugin();

			const testPlugin = createMockPlugin('test');

			act(() => {
				registerPlugin(testPlugin);
			});

			const plugin = getPlugin('test');

			return (
				<div>
					{plugin && <div data-testid="plugin-registered" />}
					<button
						type="button"
						onClick={() => unregisterPlugin('test')}
						data-testid="unregister-button"
					>
						Unregister
					</button>
				</div>
			);
		};

		it('should provide plugin utilities', () => {
			render(
				<EntityCardProvider>
					<TestComponent />
				</EntityCardProvider>
			);

			expect(screen.getByTestId('plugin-registered')).toBeInTheDocument();

			act(() => {
				screen.getByTestId('unregister-button').click();
			});

			expect(screen.queryByTestId('plugin-registered')).not.toBeInTheDocument();
		});
	});
});