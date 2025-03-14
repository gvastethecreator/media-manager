'use client';

import * as React from 'react';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';
import type { FilterConfig } from './actions/filter-config.action';
import { BaseFilter } from './base-filter';
import { DistortionFilter } from './distortion-filter';
import { GlowFilter } from './glow-filter';
import { ShadowFilter } from './shadow-filter';

interface FilterEffectLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	config?: FilterConfig;
}

export function FilterEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: FilterEffectLayerProps) {
	// Si no hay configuración o está deshabilitado, no renderizamos
	if (!config || !config.enabled) {
		return null;
	}

	// Opciones base para filtros
	const baseOptions = {
		visibleOnHover: config.visibleOnHover || false,
		opacity: config.opacity || 1,
		intensity: config.intensity || 1,
	};

	// Renderizar los filtros activos según la configuración
	return (
		<>
			{config.glow?.enabled && (
				<BaseFilter
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={{
						...baseOptions,
						...config.glow,
					}}
				>
					<GlowFilter
						color={config.glow.color || 'rgba(0, 0, 255, 0.3)'}
						radius={config.glow.radius || 10}
						intensity={config.glow.intensity || 1}
					/>
				</BaseFilter>
			)}

			{config.shadow?.enabled && (
				<BaseFilter
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={{
						...baseOptions,
						...config.shadow,
					}}
				>
					<ShadowFilter
						color={config.shadow.color || 'rgba(0, 0, 0, 0.3)'}
						blur={config.shadow.blur || 5}
						offsetX={config.shadow.offsetX || 0}
						offsetY={config.shadow.offsetY || 5}
						inset={config.shadow.inset || false}
					/>
				</BaseFilter>
			)}

			{config.distortion?.enabled && (
				<BaseFilter
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={{
						...baseOptions,
						...config.distortion,
					}}
				>
					<DistortionFilter
						type={config.distortion.type || 'wave'}
						amount={config.distortion.amount || 5}
						speed={config.distortion.speed || 1}
						animated={config.distortion.animated || false}
					/>
				</BaseFilter>
			)}
		</>
	);
}

// Versión con estilos preconfigurados para el export
export default function FilterEffectLayerWithStyles(props: FilterEffectLayerProps) {
	return (
		<div className="filter-effect-container">
			<FilterEffectLayer {...props} />
		</div>
	);
}
