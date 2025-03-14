import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';
import { BasePattern } from './base-pattern';

interface LinesPatternProps {
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
		lineWidth?: number;
		spacing?: number;
		angle?: number;
	};
}

export function LinesPattern(props: LinesPatternProps) {
	const { lineWidth = 1, spacing = 20, angle = 45 } = props.options || {};

	const pattern = (
		<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
			<title>Patrón de líneas decorativo</title>
			<defs>
				<pattern id="lines" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
					<line x1="0" y1="0" x2={spacing} y2={spacing} stroke="currentColor" strokeWidth={lineWidth} />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#lines)" style={{ transform: `rotate(${angle}deg)` }} />
		</svg>
	);

	return <BasePattern {...props}>{pattern}</BasePattern>;
}
