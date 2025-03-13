import { cn } from '@/lib/utils';
import type * as React from 'react';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';

interface BasePatternProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		visibleOnHover?: boolean;
		opacity?: number;
		scale?: number;
		rotation?: number;
		color?: string;
	};
	children: React.ReactNode;
}

export function BasePattern({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options = {},
	children,
}: BasePatternProps) {
	const { visibleOnHover = true, opacity = 0.1, scale = 1, rotation = 0, color = 'currentColor' } = options;

	if (!isHovered && visibleOnHover) {
		return null;
	}

	return (
		<div
			className={cn('absolute inset-0 pointer-events-none z-10 pattern-layer', isExploded ? 'exploded-layer' : '')}
			style={{
				...(isExploded ? getExplodeLayerTransform(6) : {}),
				opacity,
				transform: `scale(${scale}) rotate(${rotation}deg)`,
				color,
			}}
			data-layer-active={activeLayer === 'pattern' || null}
		>
			{children}
		</div>
	);
}
