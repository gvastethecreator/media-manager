import { act, fireEvent, render, screen } from '@testing-library/react';
import { EntityCard } from '../../EntityCard';
import { EntityCardProvider } from '../../providers/EntityCardProvider';
import { useLayerInteraction } from '../hooks/useLayerInteraction';
import { RegisterLayers } from '../register-layers';

// 🎮 Mock de capas interactivas para pruebas
const HoverLayer = {
	id: 'hover-layer',
	name: 'Hover Layer',
	type: 'interactive',
	Component: ({ enabled, config, onInteraction }) => (
		enabled ? (
			<div
				data-testid="hover-layer"
				onMouseEnter={() => onInteraction?.('hover:enter')}
				onMouseLeave={() => onInteraction?.('hover:leave')}
			>
				{config?.text || 'Hover Me'}
			</div>
		) : null
	)
};

const ClickLayer = {
	id: 'click-layer',
	name: 'Click Layer',
	type: 'interactive',
	Component: ({ enabled, config, onInteraction }) => (
		enabled ? (
			<button
				type="button"
				data-testid="click-layer"
				onClick={() => onInteraction?.('click', { x: 0, y: 0 })}
			>
				{config?.text || 'Click Me'}
			</button>
		) : null
	)
};

const DragLayer = {
	id: 'drag-layer',
	name: 'Drag Layer',
	type: 'interactive',
	Component: ({ enabled, config, onInteraction }) => {
		const handleDragStart = () => onInteraction?.('drag:start');
		const handleDragEnd = () => onInteraction?.('drag:end');

		return enabled ? (
			<div
				data-testid="drag-layer"
				draggable
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{config?.text || 'Drag Me'}
			</div>
		) : null;
	}
};

// 🧪 Componente de prueba que usa el hook useLayerInteraction
function TestInteractionComponent() {
	const { registerInteraction, lastInteraction } = useLayerInteraction();

	return (
		<div>
			<EntityCard
				entityId="test"
				entityType="test"
				layers={{
					'hover-layer': {
						enabled: true,
						onInteraction: registerInteraction
					},
					'click-layer': {
						enabled: true,
						onInteraction: registerInteraction
					},
					'drag-layer': {
						enabled: true,
						onInteraction: registerInteraction
					}
				}}
			/>
			<pre data-testid="last-interaction">
				{JSON.stringify(lastInteraction)}
			</pre>
		</div>
	);
}

// 📚 Suite de pruebas principal
describe('Interactive Layers', () => {
	// 🎯 Pruebas básicas de interacción
	describe('Basic Interactions', () => {
		it('should handle hover interactions', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HoverLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			const hoverElement = screen.getByTestId('hover-layer');

			fireEvent.mouseEnter(hoverElement);
			expect(screen.getByTestId('last-interaction')).toHaveTextContent('hover:enter');

			fireEvent.mouseLeave(hoverElement);
			expect(screen.getByTestId('last-interaction')).toHaveTextContent('hover:leave');
		});

		it('should handle click interactions with data', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[ClickLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			fireEvent.click(screen.getByTestId('click-layer'));
			const interaction = JSON.parse(screen.getByTestId('last-interaction').textContent || '{}');

			expect(interaction.type).toBe('click');
			expect(interaction.data).toEqual({ x: 0, y: 0 });
		});

		it('should handle drag interactions', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[DragLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			const dragElement = screen.getByTestId('drag-layer');

			fireEvent.dragStart(dragElement);
			expect(screen.getByTestId('last-interaction')).toHaveTextContent('drag:start');

			fireEvent.dragEnd(dragElement);
			expect(screen.getByTestId('last-interaction')).toHaveTextContent('drag:end');
		});
	});

	// 🔄 Pruebas de múltiples capas interactivas
	describe('Multiple Interactive Layers', () => {
		it('should handle interactions from multiple layers', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HoverLayer, ClickLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			fireEvent.mouseEnter(screen.getByTestId('hover-layer'));
			expect(screen.getByTestId('last-interaction')).toHaveTextContent('hover:enter');

			fireEvent.click(screen.getByTestId('click-layer'));
			expect(screen.getByTestId('last-interaction')).toHaveTextContent('click');
		});

		it('should maintain interaction state between renders', () => {
			const { rerender } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HoverLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			fireEvent.mouseEnter(screen.getByTestId('hover-layer'));
			const initialState = screen.getByTestId('last-interaction').textContent;

			rerender(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HoverLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			expect(screen.getByTestId('last-interaction')).toHaveTextContent(initialState || '');
		});
	});

	// 🎭 Pruebas de gestión de estado de interacción
	describe('Interaction State Management', () => {
		it('should update interaction state correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[ClickLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			const clickElement = screen.getByTestId('click-layer');

			act(() => {
				fireEvent.click(clickElement);
			});

			const state = JSON.parse(screen.getByTestId('last-interaction').textContent || '{}');
			expect(state.type).toBe('click');
			expect(state.layerId).toBe('click-layer');
		});

		it('should handle rapid interactions correctly', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HoverLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			const hoverElement = screen.getByTestId('hover-layer');

			act(() => {
				fireEvent.mouseEnter(hoverElement);
				fireEvent.mouseLeave(hoverElement);
				fireEvent.mouseEnter(hoverElement);
			});

			expect(screen.getByTestId('last-interaction')).toHaveTextContent('hover:enter');
		});
	});

	// 🔒 Pruebas de validación de interacciones
	describe('Interaction Validation', () => {
		it('should handle invalid interaction types gracefully', () => {
			const InvalidLayer = {
				...ClickLayer,
				id: 'invalid-layer',
				Component: ({ enabled, onInteraction }) => (
					enabled ? (
						<button
							type="button"
							data-testid="invalid-layer"
							onClick={() => onInteraction?.('invalid:type')}
						>
							Invalid
						</button>
					) : null
				)
			};

			const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[InvalidLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			fireEvent.click(screen.getByTestId('invalid-layer'));
			expect(consoleError).not.toHaveBeenCalled();

			consoleError.mockRestore();
		});
	});

	// 🎮 Pruebas de interacciones complejas
	describe('Complex Interactions', () => {
		const GestureLayer = {
			id: 'gesture-layer',
			name: 'Gesture Layer',
			type: 'interactive',
			Component: ({ enabled, onInteraction }) => {
				let startX = 0;
				let startY = 0;

				const handleTouchStart = (e: React.TouchEvent) => {
					startX = e.touches[0].clientX;
					startY = e.touches[0].clientY;
					onInteraction?.('gesture:start', { x: startX, y: startY });
				};

				const handleTouchMove = (e: React.TouchEvent) => {
					const x = e.touches[0].clientX;
					const y = e.touches[0].clientY;
					onInteraction?.('gesture:move', {
						x,
						y,
						deltaX: x - startX,
						deltaY: y - startY
					});
				};

				const handleTouchEnd = () => {
					onInteraction?.('gesture:end');
				};

				return enabled ? (
					<div
						data-testid="gesture-layer"
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
					>
						Gesture Area
					</div>
				) : null;
			}
		};

		it('should handle complex gesture interactions', () => {
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[GestureLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			const gestureElement = screen.getByTestId('gesture-layer');

			// Simular inicio del gesto
			fireEvent.touchStart(gestureElement, {
				touches: [{ clientX: 0, clientY: 0 }]
			});

			// Simular movimiento
			fireEvent.touchMove(gestureElement, {
				touches: [{ clientX: 100, clientY: 50 }]
			});

			// Simular fin del gesto
			fireEvent.touchEnd(gestureElement);

			const finalState = JSON.parse(screen.getByTestId('last-interaction').textContent || '{}');
			expect(finalState.type).toBe('gesture:end');
		});
	});

	// 🔄 Pruebas de ciclo de vida
	describe('Lifecycle', () => {
		it('should clean up interaction handlers on unmount', () => {
			const { unmount } = render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HoverLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			fireEvent.mouseEnter(screen.getByTestId('hover-layer'));
			unmount();

			// Re-renderizar para verificar que el estado se limpió
			render(
				<EntityCardProvider>
					<RegisterLayers initialLayers={[HoverLayer]} />
					<TestInteractionComponent />
				</EntityCardProvider>
			);

			expect(screen.getByTestId('last-interaction')).not.toHaveTextContent('hover:enter');
		});
	});
});