import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';
import { BaseFilter } from './base-filter';

interface ShadowFilterProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		visibleOnHover?: boolean;
		opacity?: number;
		intensity?: number;
		color?: string;
		offsetX?: number;
		offsetY?: number;
		blur?: number;
	};
}

export function ShadowFilter(props: ShadowFilterProps) {
	const { offsetX = 0, offsetY = 4, blur = 4, color = 'rgba(0, 0, 0, 0.5)' } = props.options || {};

	const filter = (
		<svg
			width="0"
			height="0"
			xmlns="http://www.w3.org/2000/svg"
			style={{ position: 'absolute', width: 0, height: 0 }}
			aria-hidden="true"
		>
			<title>Filtro de sombra</title>
			<defs>
				<filter id="shadow">
					<feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="blur" />
					<feOffset in="blur" dx={offsetX} dy={offsetY} result="offsetBlur" />
					<feFlood floodColor={color} result="color" />
					<feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
					<feMerge>
						<feMergeNode in="shadow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
		</svg>
	);

	return <BaseFilter {...props}>{filter}</BaseFilter>;
}
