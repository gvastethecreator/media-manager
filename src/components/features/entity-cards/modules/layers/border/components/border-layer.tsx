'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import type { BorderConfig } from '../actions/border-config.action';
import { useBorder } from '../hooks/use-border';

// Define la interfaz de propiedades comunes para capas
interface CommonLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: (index: number) => any;
}

interface BorderLayerProps extends CommonLayerProps {
	config: BorderConfig & {
		visibleOnHover?: boolean;
		layerIndex?: number;
		blendMode?: string;
	};
}

export function BorderLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: BorderLayerProps) {
	// Determinar si se debe renderizar
	const shouldRender = useMemo(() => {
		return config.enabled && (isHovered || !config.visibleOnHover || (activeLayer === 'border' && isExploded));
	}, [config.enabled, config.visibleOnHover, isHovered, activeLayer, isExploded]);

	// Usar el hook de borde
	const { containerRef, error, initializeBorder } = useBorder({
		config,
		shouldRender,
	});

	// Si hay un error o no se debe renderizar, no mostrar nada
	if (error || !shouldRender) {
		return null;
	}

	// Propiedades de animación
	const motionProps = {
		initial: { opacity: 0 },
		animate: { opacity: config.opacity || 1 },
		transition: { duration: 0.3 },
		style: {
			...getExplodeLayerTransform(config.layerIndex || 2),
			...(isExploded ? { zIndex: config.layerIndex || 2 } : {}),
		},
	};

	return (
		<motion.div
			ref={containerRef}
			className={cn(
				'absolute inset-0 z-0 overflow-hidden',
				isExploded ? 'exploded-layer layer-border' : '',
				activeLayer === 'border' ? 'active-layer z-30' : ''
			)}
			{...motionProps}
			data-layer-id="border"
			data-layer-active={activeLayer === 'border' || null}
			onLoad={initializeBorder}
			style={{
				...motionProps.style,
				mixBlendMode: config.blendMode || 'normal',
			}}
		/>
	);
}