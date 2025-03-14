'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_EXPLODE_SYSTEM } from './explode-module';
import type { ExplodeSystem } from './types';

/**
 * Hook personalizado para gestionar el sistema de vista explosionada
 */
export function useExplodeSystem(initialSystem?: Partial<ExplodeSystem>) {
	// Inicializar el estado con los valores predeterminados combinados con los proporcionados
	const [explodeSystem, setExplodeSystem] = useState<ExplodeSystem>({
		...DEFAULT_EXPLODE_SYSTEM,
		...initialSystem,
	});

	/**
	 * Actualizar el sistema de explosión
	 */
	const updateExplodeSystem = useCallback((update: Partial<ExplodeSystem>) => {
		setExplodeSystem((prev) => ({
			...prev,
			...update,
		}));
	}, []);

	/**
	 * Restablecer el sistema de explosión a los valores iniciales
	 */
	const resetExplodeSystem = useCallback(() => {
		setExplodeSystem({
			...DEFAULT_EXPLODE_SYSTEM,
			...initialSystem,
		});
	}, [initialSystem]);

	/**
	 * Generar estilos CSS para una capa en la vista explosionada
	 */
	const generateExplodeStyles = useCallback(
		(layerIndex: number, totalLayers: number) => {
			if (!explodeSystem.enabled || totalLayers <= 1) {
				return {};
			}

			// Calcular la posición relativa de la capa
			const centerIndex = Math.floor(totalLayers / 2);
			const relativePosition = layerIndex - centerIndex;

			// Si hay una capa central definida, ajustar la posición relativa
			const hasCenterLayer = explodeSystem.centerLayer && explodeSystem.centerLayer !== '';
			const isCenterLayer = hasCenterLayer && `layer-${layerIndex}` === explodeSystem.centerLayer;

			// Si es la capa central, no aplicar desplazamiento
			if (isCenterLayer) {
				return {
					zIndex: 10 + layerIndex,
					position: 'relative',
					transition: explodeSystem.animated
						? `transform ${explodeSystem.animationDuration}ms ${explodeSystem.staggered ? layerIndex * explodeSystem.staggerDelay : 0}ms`
						: undefined,
				};
			}

			// Calcular transformaciones según la dirección
			let transform = '';

			if (explodeSystem.direction === 'x' || explodeSystem.direction === '3d') {
				const xOffset = relativePosition * explodeSystem.distance;
				transform += `translateX(${xOffset}px) `;
			}

			if (explodeSystem.direction === 'y' || explodeSystem.direction === '3d') {
				const yOffset = relativePosition * explodeSystem.distance;
				transform += `translateY(${yOffset}px) `;
			}

			if (explodeSystem.direction === 'z' || explodeSystem.direction === '3d') {
				const zOffset = relativePosition * explodeSystem.distance;
				transform += `translateZ(${zOffset}px) `;
			}

			// Aplicar rotaciones si están definidas
			if (explodeSystem.rotationX !== 0) {
				transform += `rotateX(${explodeSystem.rotationX}deg) `;
			}

			if (explodeSystem.rotationY !== 0) {
				transform += `rotateY(${explodeSystem.rotationY}deg) `;
			}

			if (explodeSystem.rotationZ !== 0) {
				transform += `rotateZ(${explodeSystem.rotationZ}deg) `;
			}

			return {
				transform,
				zIndex: 10 + layerIndex,
				position: 'relative',
				perspective: `${explodeSystem.perspective}px`,
				transformStyle: 'preserve-3d',
				transition: explodeSystem.animated
					? `transform ${explodeSystem.animationDuration}ms ${explodeSystem.staggered ? layerIndex * explodeSystem.staggerDelay : 0}ms`
					: undefined,
				':hover': explodeSystem.expandOnHover
					? {
							transform: transform.replace(
								/translateX\((\d+)px\)/,
								`translateX(${explodeSystem.distance * explodeSystem.hoverExpandFactor}px)`
							),
						}
					: undefined,
			};
		},
		[explodeSystem]
	);

	return {
		explodeSystem,
		updateExplodeSystem,
		resetExplodeSystem,
		generateExplodeStyles,
	};
}
