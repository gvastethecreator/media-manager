import type { ExplodeLayerTransformFunction } from "../../types/base-card-types";
import { BasePattern } from "./base-pattern";

interface GridPatternProps {
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
	};
}

export function GridPattern(props: GridPatternProps) {
	const { lineWidth = 1, spacing = 20 } = props.options || {};

	const pattern = (
		<svg
			width="100%"
			height="100%"
			xmlns="http://www.w3.org/2000/svg"
			style={{ width: "100%", height: "100%" }}
		>
			<title>Patrón de cuadrícula decorativo</title>
			<defs>
				<pattern
					id="grid"
					width={spacing}
					height={spacing}
					patternUnits="userSpaceOnUse"
				>
					<path
						d={`M ${spacing} 0 L 0 0 0 ${spacing}`}
						fill="none"
						stroke="currentColor"
						strokeWidth={lineWidth}
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg>
	);

	return <BasePattern {...props}>{pattern}</BasePattern>;
}
