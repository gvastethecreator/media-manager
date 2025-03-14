import type * as React from 'react';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';

interface BaseFilterProps {
	children: React.ReactNode;
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		visibleOnHover?: boolean;
		opacity?: number;
		intensity?: number;
	};
}

export function BaseFilter({
	children,
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options = {},
}: BaseFilterProps) {
	const { visibleOnHover = false, opacity = 1, intensity = 1 } = options;

	// Si está en modo explotado, no aplicamos el filtro
	if (isExploded) {
		return null;
	}

	// Si está configurado para mostrar solo en hover y no está en hover, no mostramos
	if (visibleOnHover && !isHovered) {
		return null;
	}

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				opacity: opacity * intensity,
				...(isExploded ? getExplodeLayerTransform(0) : {}),
			}}
			data-layer-active={activeLayer === 'filter' || null}
		>
			{children}
		</div>
	);
}
