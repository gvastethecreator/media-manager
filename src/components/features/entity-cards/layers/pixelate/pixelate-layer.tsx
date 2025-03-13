import { cn } from '@/lib/utils';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';

interface PixelateLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		pixelSize?: number;
		intensity?: number;
		visibleOnHover?: boolean;
	};
}

export function PixelateLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options = {},
}: PixelateLayerProps) {
	const { pixelSize = 4, intensity = 0.5, visibleOnHover = true } = options;

	if (!isHovered && visibleOnHover) {
		return null;
	}

	return (
		<div
			className={cn('absolute inset-0 pointer-events-none z-25 pixelate-layer', isExploded ? 'exploded-layer' : '')}
			style={{
				...(isExploded ? getExplodeLayerTransform(4) : {}),
				transform: `scale(${1 - (pixelSize * intensity) / 100})`,
				transformOrigin: 'center',
			}}
			data-layer-active={activeLayer === 'pixelate' || null}
		/>
	);
}
