'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ExplodeLayerTransformFunction } from '../../../../../types/base-card-types';
import type { PatternConfig } from '../actions/pattern-config.action';
import { usePattern } from '../hooks/use-pattern';

interface PatternLayerProps {
	/** Estado de explosión de la capa */
	isExploded: boolean;
	/** Estado de hover de la capa */
	isHovered: boolean;
	/** Capa actualmente activa */
	activeLayer: string | null;
	/** Función para obtener la transformación de explosión */
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	/** Configuración del patrón */
	config: PatternConfig;
}

/**
 * 🔲 Componente que renderiza una capa de patrones geométricos
 * @component PatternLayer
 */
export function PatternLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: PatternLayerProps) {
	const [shouldRender, setShouldRender] = useState(true);

	// Extraer configuración con valores por defecto
	const { enabled = true, visibleOnHover = true, blendMode = 'overlay' } = config;

	// Determinar si debemos renderizar el componente
	useEffect(() => {
		setShouldRender(enabled && (!visibleOnHover || isHovered));
	}, [enabled, visibleOnHover, isHovered]);

	// Usar el hook personalizado
	const { canvasRef, error } = usePattern({
		config,
		shouldRender,
	});

	if (!shouldRender) return null;
	if (error) {
		console.error('PatternLayer Error:', error);
		return null;
	}

	return (
		<motion.div
			className={cn('absolute inset-0 pointer-events-none', isExploded ? 'exploded-layer' : '')}
			style={{
				...(isExploded ? getExplodeLayerTransform(2) : {}),
				zIndex: 10,
			}}
			initial={{ opacity: 0 }}
			animate={{
				opacity: 1,
				scale: activeLayer === 'pattern' && isExploded ? 1.05 : 1,
			}}
			data-layer-active={activeLayer === 'pattern' || null}
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