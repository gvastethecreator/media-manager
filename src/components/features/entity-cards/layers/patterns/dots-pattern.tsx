import type { ExplodeLayerTransformFunction } from "../../types/base-card-types";
import { BasePattern } from "./base-pattern";

interface DotsPatternProps {
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
		dotSize?: number;
		spacing?: number;
	};
}

export function DotsPattern(props: DotsPatternProps) {
	const { dotSize = 2, spacing = 20 } = props.options || {};

	const pattern = (
		<svg
			width="100%"
			height="100%"
			xmlns="http://www.w3.org/2000/svg"
			style={{ width: "100%", height: "100%" }}
		>
			<title>Patrón de puntos decorativo</title>
			<defs>
				<pattern
					id="dots"
					width={spacing}
					height={spacing}
					patternUnits="userSpaceOnUse"
				>
					<circle
						cx={spacing / 2}
						cy={spacing / 2}
						r={dotSize}
						fill="currentColor"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#dots)" />
		</svg>
	);

	return <BasePattern {...props}>{pattern}</BasePattern>;
}
