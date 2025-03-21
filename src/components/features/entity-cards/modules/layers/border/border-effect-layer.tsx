'use client';

import { useMemo } from 'react';
import type { LayerComponentProps } from '../types';

/**
 * Tipo para la configuración del borde
 */
export interface BorderConfig {
	enabled: boolean;
	width: number;
	style: string;
	color: string;
	radius?: number;
	animated?: boolean;
	animationType?: 'none' | 'pulse' | 'flow' | 'rainbow';
	animationSpeed?: number;
	glowAmount?: number;
	opacity?: number;
	cornerStyle?: string;
	layerIndex?: number;
	visibleOnHover?: boolean;
	blendMode?: string;
}

/**
 * 🔲 Capa de efecto de borde
 * Renderiza un borde alrededor del contenido con estilo personalizable.
 */
export function BorderEffectLayer({ config, children }: LayerComponentProps<BorderConfig>) {
	// Si la capa está desactivada, retornar solamente los children
	if (!config.enabled) {
		return <>{children}</>;
	}

	// Calcular estilos de borde
	const borderStyle = useMemo(() => {
		return {
			border: `${config.width}px ${config.style} ${config.color}`,
			borderRadius: config.radius ? `${config.radius}px` : '0',
			boxShadow: config.glowAmount
				? `0 0 ${config.glowAmount}px ${config.color}`
				: 'none',
			opacity: config.opacity ?? 1,
			overflow: 'hidden',
			transition: 'all 0.2s ease',
			position: 'relative' as const,
			zIndex: config.layerIndex ?? 1,
			animation: config.animated && config.animationType !== 'none'
				? `${config.animationType}-animation ${config.animationSpeed || 1}s infinite`
				: 'none',
		};
	}, [config]);

	// Detectar si es visible solo en hover
	const className = config.visibleOnHover
		? 'transition-opacity opacity-0 group-hover:opacity-100'
		: '';

	return (
		<div
			className={`border-effect-layer relative ${className}`}
			style={borderStyle}
			data-layer-type="border"
		>
			{children}
		</div>
	);
}

export default BorderEffectLayer;