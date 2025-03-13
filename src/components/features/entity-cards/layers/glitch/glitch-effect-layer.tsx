import { cn } from '@/lib/utils';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';

interface GlitchEffectLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		intensity?: number;
		frequency?: number;
		visibleOnHover?: boolean;
	};
}

export function GlitchEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options = {},
}: GlitchEffectLayerProps) {
	const { intensity = 0.1, frequency = 0.05, visibleOnHover = true } = options;

	if (!isHovered && visibleOnHover) {
		return null;
	}

	return (
		<div
			className={cn(
				'absolute inset-0 pointer-events-none z-20 glitch-effect-layer',
				isExploded ? 'exploded-layer' : ''
			)}
			style={{
				...(isExploded ? getExplodeLayerTransform(2) : {}),
				animation: `glitch ${frequency}s infinite`,
				transform: `translate(${Math.random() * intensity * 2 - intensity}px, ${Math.random() * intensity * 2 - intensity}px)`,
			}}
			data-layer-active={activeLayer === 'glitch' || null}
		/>
	);
}
