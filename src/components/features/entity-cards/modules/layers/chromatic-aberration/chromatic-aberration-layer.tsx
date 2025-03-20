import { cn } from '@/lib/utils';
import type { ExplodeLayerTransformFunction } from '../../../../types/base-card-types';

interface ChromaticAberrationLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		offset?: number;
		intensity?: number;
		visibleOnHover?: boolean;
	};
}

export function ChromaticAberrationLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options = {},
}: ChromaticAberrationLayerProps) {
	const { offset = 2, intensity = 0.5, visibleOnHover = true } = options;

	if (!isHovered && visibleOnHover) {
		return null;
	}

	return (
		<div
			className={cn(
				'absolute inset-0 pointer-events-none z-25 chromatic-aberration-layer',
				isExploded ? 'exploded-layer' : ''
			)}
			style={{
				...(isExploded ? getExplodeLayerTransform(4) : {}),
				filter: `blur(${offset}px)`,
				transform: `translate(${offset * intensity}px, ${offset * intensity}px)`,
			}}
			data-layer-active={activeLayer === 'chromatic' || null}
		/>
	);
}
