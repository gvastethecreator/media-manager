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
	// Estado para rastrear la posición del ratón con throttling
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const lastUpdateRef = React.useRef<number>(0);
	const THROTTLE_MS = 16; // ~60fps

	// Valores por defecto
	const defaultConfig = React.useMemo<HolographicConfig>(() => ({
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
	}), []);

	// Combinar configuración con memo
	const mergedConfig = React.useMemo(
		() => ({ ...defaultConfig, ...config }),
		[defaultConfig, config]
	);

	// Función throttled para actualizar la posición del ratón
	const handleMouseMove = React.useCallback((event: MouseEvent) => {
		const now = Date.now();
		if (now - lastUpdateRef.current >= THROTTLE_MS) {
			setMousePosition({
				x: event.clientX / window.innerWidth,
				y: event.clientY / window.innerHeight,
			});
			lastUpdateRef.current = now;
		}
	}, []);

	// Cleanup y setup de event listeners
	React.useEffect(() => {
		if (!mergedConfig.enabled || mergedConfig.interactiveMode !== 'mouse') {
			return;
		}

		window.addEventListener('mousemove', handleMouseMove, { passive: true });

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	}, [mergedConfig.enabled, mergedConfig.interactiveMode, handleMouseMove]);

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Convertir configuración al formato esperado por HolographicLayer
	const primaryColor = mergedConfig.colors[0] || 'rgba(0, 153, 255, 0.2)';
	const secondaryColor = mergedConfig.colors[1] || 'rgba(128, 0, 255, 0.2)';

	const holographicOptions = React.useMemo(() => ({
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
	}), [mergedConfig]);

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

export default React.memo(HolographicEffectWrapper);
