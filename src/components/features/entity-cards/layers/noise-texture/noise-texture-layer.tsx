import { cn } from '@/lib/utils';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';

interface NoiseTextureLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		density?: number;
		opacity?: number;
		visibleOnHover?: boolean;
	};
}

export function NoiseTextureLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options = {},
}: NoiseTextureLayerProps) {
	const { density = 0.6, opacity = 0.1, visibleOnHover = true } = options;

	if (!isHovered && visibleOnHover) {
		return null;
	}

	return (
		<div
			className={cn(
				'absolute inset-0 pointer-events-none z-15 noise-texture-layer',
				isExploded ? 'exploded-layer' : ''
			)}
			style={{
				...(isExploded ? getExplodeLayerTransform(3) : {}),
				backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${density}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${opacity}'/%3E%3C/svg%3E")`,
			}}
			data-layer-active={activeLayer === 'noise' || null}
		/>
	);
}
