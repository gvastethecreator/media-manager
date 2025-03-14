'use client';

import * as React from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';
import type { HolographicConfig } from './actions/holographic-config.action';
import { HolographicLayer } from './holographic-layer';

/**
 * Componente wrapper para adaptar la capa de efecto Holográfico al sistema de plugins.
 * Esta capa añade un efecto iridiscente que simula materiales holográficos.
 */
export function HolographicEffectWrapper({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: LayerComponentProps<HolographicConfig>) {
	// Estado para rastrear la posición del ratón
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

	// Valores por defecto
	const defaultConfig: HolographicConfig = {
		enabled: true,
		intensity: 0.7,
		pattern: 'rainbow',
		colors: ['rgba(255,0,128,0.8)', 'rgba(0,255,255,0.8)', 'rgba(128,0,255,0.8)'],
		speed: 1,
		angle: 45,
		scale: 1,
		blend: 'overlay',
		animated: true,
		interactiveMode: 'mouse',
	};

	// Combinar configuración
	const mergedConfig = { ...defaultConfig, ...config };

	// Actualizar posición del ratón
	React.useEffect(() => {
		// Si no está habilitado, no hay necesidad de actualizar posición del ratón
		if (!mergedConfig.enabled) {
			return;
		}

		const handleMouseMove = (event: MouseEvent) => {
			setMousePosition({
				x: event.clientX,
				y: event.clientY,
			});
		};

		// Solo agregar listener si el modo interactivo es "mouse"
		if (mergedConfig.interactiveMode === 'mouse') {
			window.addEventListener('mousemove', handleMouseMove);

			// Limpiar el evento cuando se desmonta el componente
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
			};
		}

		// Devolver una función de limpieza vacía si no hay listener
		return () => {};
	}, [mergedConfig.interactiveMode, mergedConfig.enabled]);

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Convertir configuración al formato esperado por HolographicLayer
	const primaryColor = mergedConfig.colors[0] || 'rgba(0, 153, 255, 0.2)';
	const secondaryColor = mergedConfig.colors[1] || 'rgba(128, 0, 255, 0.2)';

	const holographicOptions = {
		intensity: mergedConfig.intensity,
		pattern: mergedConfig.pattern,
		colors: mergedConfig.colors,
		speed: mergedConfig.speed || 1,
		angle: mergedConfig.angle || 45,
		scale: mergedConfig.scale || 1,
		blend: mergedConfig.blend || 'overlay',
		animated: mergedConfig.animated || false,
		interactiveMode: mergedConfig.interactiveMode || 'none',
		layerIndex: 4,
	};

	return (
		<HolographicLayer
			isExploded={isExploded}
			isHovered={isHovered}
			mousePosition={mousePosition}
			activeLayer={activeLayer}
			getExplodeLayerTransform={getExplodeLayerTransform}
			primaryColor={primaryColor}
			secondaryColor={secondaryColor}
			options={holographicOptions}
			visibleOnHover={!mergedConfig.animated}
		/>
	);
}

export default HolographicEffectWrapper;
