import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';
import { BaseFilter } from './base-filter';

interface GlowFilterProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		visibleOnHover?: boolean;
		opacity?: number;
		intensity?: number;
		color?: string;
		radius?: number;
		spread?: number;
	};
}

export function GlowFilter(props: GlowFilterProps) {
	const { radius = 10, color = 'rgba(0, 153, 255, 0.5)' } = props.options || {};

	const filter = (
		<svg
			width="0"
			height="0"
			xmlns="http://www.w3.org/2000/svg"
			style={{ position: 'absolute', width: 0, height: 0 }}
			aria-hidden="true"
		>
			<defs>
				<filter id="glow">
					<feGaussianBlur in="SourceGraphic" stdDeviation={radius} result="blur" />
					<feComposite in="blur" in2="SourceGraphic" operator="over" result="glow" />
					<feFlood floodColor={color} result="color" />
					<feComposite in="color" in2="glow" operator="in" result="coloredGlow" />
					<feMerge>
						<feMergeNode in="coloredGlow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
		</svg>
	);

	return <BaseFilter {...props}>{filter}</BaseFilter>;
}
