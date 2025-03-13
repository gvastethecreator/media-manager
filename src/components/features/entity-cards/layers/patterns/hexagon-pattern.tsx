import type { ExplodeLayerTransformFunction } from "../../types/base-card-types";
import { BasePattern } from "./base-pattern";

interface HexagonPatternProps {
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
		size?: number;
		spacing?: number;
	};
}

export function HexagonPattern(props: HexagonPatternProps) {
	const { size = 20, spacing = 30 } = props.options || {};

	// Función para generar los puntos de un hexágono
	const getHexagonPoints = (centerX: number, centerY: number, size: number) => {
		const points = [];
		for (let i = 0; i < 6; i++) {
			const angle = (i * Math.PI) / 3;
			const x = centerX + size * Math.cos(angle);
			const y = centerY + size * Math.sin(angle);
			points.push(`${x},${y}`);
		}
		return points.join(" ");
	};

	const pattern = (
		<svg
			width="100%"
			height="100%"
			xmlns="http://www.w3.org/2000/svg"
			style={{ width: "100%", height: "100%" }}
		>
			<title>Patrón de hexágonos decorativo</title>
			<defs>
				<pattern
					id="hexagons"
					width={spacing}
					height={spacing}
					patternUnits="userSpaceOnUse"
				>
					<polygon
						points={getHexagonPoints(spacing / 2, spacing / 2, size)}
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#hexagons)" />
		</svg>
	);

	return <BasePattern {...props}>{pattern}</BasePattern>;
}
