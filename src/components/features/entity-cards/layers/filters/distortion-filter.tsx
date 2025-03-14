import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';
import { BaseFilter } from './base-filter';

interface DistortionFilterProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		visibleOnHover?: boolean;
		opacity?: number;
		intensity?: number;
		color?: string;
		frequency?: number;
		amplitude?: number;
	};
}

export function DistortionFilter(props: DistortionFilterProps) {
	const { frequency = 0.1, amplitude = 5 } = props.options || {};

	const filter = (
		<svg
			width="0"
			height="0"
			xmlns="http://www.w3.org/2000/svg"
			style={{ position: 'absolute', width: 0, height: 0 }}
			aria-hidden="true"
		>
			<defs>
				<filter id="distortion">
					<feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves="3" result="noise" />
					<feDisplacementMap
						in="SourceGraphic"
						in2="noise"
						scale={amplitude}
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
			</defs>
		</svg>
	);

	return <BaseFilter {...props}>{filter}</BaseFilter>;
}
