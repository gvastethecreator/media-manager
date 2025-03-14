'use client';

import * as React from 'react';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';
import type { PatternConfig } from './actions/pattern-config.action';
import { BasePattern } from './base-pattern';
import { DotsPattern } from './dots-pattern';
import { GridPattern } from './grid-pattern';
import { HexagonPattern } from './hexagon-pattern';
import { LinesPattern } from './lines-pattern';

interface PatternEffectLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	config?: PatternConfig;
}

export function PatternEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: PatternEffectLayerProps) {
	// Si no hay configuración o está deshabilitado, no renderizamos
	if (!config || !config.enabled) {
		return null;
	}

	// Opciones base para patrones
	const baseOptions = {
		visibleOnHover: config.visibleOnHover || false,
		opacity: config.opacity || 0.15,
		animated: config.animated || false,
		animationSpeed: config.animationSpeed || 1,
	};

	// Mapear tipo de patrón a componente correspondiente
	const renderPattern = () => {
		const commonProps = {
			color: config.color || 'rgba(255, 255, 255, 0.15)',
			secondaryColor: config.secondaryColor,
			size: config.size || 5,
			spacing: config.spacing || 10,
			rotation: config.rotation || 0,
			blendMode: config.blendMode || 'normal',
			density: config.density || 1,
			strokeWidth: config.strokeWidth || 1,
		};

		switch (config.patternType) {
			case 'dots':
				return <DotsPattern {...commonProps} />;
			case 'lines':
				return <LinesPattern {...commonProps} />;
			case 'grid':
				return <GridPattern {...commonProps} />;
			case 'hexagon':
				return <HexagonPattern {...commonProps} />;
			default:
				return <DotsPattern {...commonProps} />;
		}
	};

	return (
		<BasePattern
			isExploded={isExploded}
			isHovered={isHovered}
			activeLayer={activeLayer}
			getExplodeLayerTransform={getExplodeLayerTransform}
			options={{
				...baseOptions,
				layerId: 'pattern',
			}}
		>
			{renderPattern()}
		</BasePattern>
	);
}

// Versión con estilos preconfigurados para el export
export default function PatternEffectLayerWithStyles(props: PatternEffectLayerProps) {
	return (
		<div className="pattern-effect-container">
			<PatternEffectLayer {...props} />
		</div>
	);
}
