'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ExplodeLayerTransformFunction } from '../../../../../types/base-card-types';
import type { NoiseTextureConfig } from '../actions/noise-texture-config.action';
import { useNoiseTexture } from '../hooks/use-noise-texture';

interface NoiseTextureLayerProps {
	/** Estado de explosión de la capa */
	isExploded: boolean;
	/** Estado de hover de la capa */
	isHovered: boolean;
	/** Capa actualmente activa */
	activeLayer: string | null;
	/** Función para obtener la transformación de explosión */
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	/** Configuración de la textura de ruido */
	config: NoiseTextureConfig;
}

/**
 * 🌫️ Componente que renderiza una capa de textura de ruido
 * @component NoiseTextureLayer
 */
export function NoiseTextureLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: NoiseTextureLayerProps) {
	const [shouldRender, setShouldRender] = useState(true);

	// Extraer configuración con valores por defecto
	const { enabled = true, visibleOnHover = true, blendMode = 'overlay' } = config;

	// Determinar si debemos renderizar el componente
	useEffect(() => {
		setShouldRender(enabled && (!visibleOnHover || isHovered));
	}, [enabled, visibleOnHover, isHovered]);

	// Usar el hook personalizado
	const { canvasRef, error } = useNoiseTexture({
		config,
		shouldRender,
	});

	if (!shouldRender) return null;
	if (error) {
		console.error('NoiseTextureLayer Error:', error);
		return null;
	}

	return (
		<motion.div
			className={cn('absolute inset-0 pointer-events-none', isExploded ? 'exploded-layer' : '')}
			style={{
				...(isExploded ? getExplodeLayerTransform(3) : {}),
				zIndex: 15,
			}}
			initial={{ opacity: 0 }}
			animate={{
				opacity: 1,
				scale: activeLayer === 'noiseTexture' && isExploded ? 1.05 : 1,
			}}
			data-layer-active={activeLayer === 'noiseTexture' || null}
		>
			<canvas
				ref={canvasRef}
				className="w-full h-full"
				style={{
					mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
				}}
			/>
		</motion.div>
	);
}
