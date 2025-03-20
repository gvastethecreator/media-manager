/**
 * 🎨 Implementación de la capa de filtros
 * @module FilterLayer
 */

'use client';

import { SlidersHorizontal } from 'lucide-react';
import * as React from 'react';
import { withBaseLayer } from '../components/base-layer';
import type { BaseLayerConfig, LayerImplementation } from '../types';
import { generateFilterStyles } from '../utils/visual-effects';
import { deleteFilterConfig, getFilterConfig, updateFilterConfig } from './actions/filter-config.action';
import { FilterEffectLayer } from './filter-effect-layer';
import { FilterSettings } from './filter-settings';
import { useVisualEffects } from './use-visual-effects';

/**
 * Tipos de presets disponibles para filtros
 */
export type FilterPreset = 'none' | 'vintage' | 'cool' | 'warm' | 'bw' | 'sepia' | 'sharp' | 'soft' | 'dramatic' | 'muted' | 'vibrant';

export interface FilterConfig extends BaseLayerConfig {
	brightness: number;
	contrast: number;
	saturation: number;
	hueRotate: number;
	blur: number;
	opacity: number;
	blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
}

export const defaultFilterConfig: FilterConfig = {
	enabled: true,
	layerIndex: 3,
	visibleOnHover: false,
	brightness: 100,
	contrast: 100,
	saturation: 100,
	hueRotate: 0,
	blur: 0,
	opacity: 100,
	blendMode: 'normal',
};

/**
 * 🎭 Componente de capa de filtros
 */
const FilterLayerComponent = React.memo(function FilterLayerComponent({
	processedConfig,
	style,
}: {
	processedConfig: FilterConfig;
	style: React.CSSProperties;
}) {
	// Generar estilos de filtro
	const filterStyle = React.useMemo(() => ({
		...style,
		...generateFilterStyles({
			brightness: processedConfig.brightness / 100,
			contrast: processedConfig.contrast,
			saturation: processedConfig.saturation,
			hueRotate: processedConfig.hueRotate,
			blur: processedConfig.blur,
			opacity: processedConfig.opacity,
		}),
		mixBlendMode: processedConfig.blendMode,
	}), [
		processedConfig.brightness,
		processedConfig.contrast,
		processedConfig.saturation,
		processedConfig.hueRotate,
		processedConfig.blur,
		processedConfig.opacity,
		processedConfig.blendMode,
		style,
	]);

	return <div style={filterStyle} />;
});

/**
 * 🎨 Capa de filtros con funcionalidad base
 */
export const FilterLayer = withBaseLayer<FilterConfig>(FilterLayerComponent);

/**
 * 🎛️ Componente de configuración de filtros
 */
export function FilterSettings({
	config,
	onConfigChange,
}: {
	config: FilterConfig;
	onConfigChange: (config: Partial<FilterConfig>) => void;
}) {
	const handleChange = React.useCallback((key: keyof FilterConfig) => (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = event.target.type === 'checkbox'
			? event.target.checked
			: Number(event.target.value);
		onConfigChange({ [key]: value });
	}, [onConfigChange]);

	return (
		<div className="space-y-4">
			<div className="grid gap-4">
				<label className="flex flex-col gap-2">
					<span>Brillo</span>
					<input
						type="range"
						min="0"
						max="200"
						value={config.brightness}
						onChange={handleChange('brightness')}
					/>
				</label>

				<label className="flex flex-col gap-2">
					<span>Contraste</span>
					<input
						type="range"
						min="0"
						max="200"
						value={config.contrast}
						onChange={handleChange('contrast')}
					/>
				</label>

				<label className="flex flex-col gap-2">
					<span>Saturación</span>
					<input
						type="range"
						min="0"
						max="200"
						value={config.saturation}
						onChange={handleChange('saturation')}
					/>
				</label>

				<label className="flex flex-col gap-2">
					<span>Rotación de Tono</span>
					<input
						type="range"
						min="0"
						max="360"
						value={config.hueRotate}
						onChange={handleChange('hueRotate')}
					/>
				</label>

				<label className="flex flex-col gap-2">
					<span>Desenfoque</span>
					<input
						type="range"
						min="0"
						max="20"
						value={config.blur}
						onChange={handleChange('blur')}
					/>
				</label>

				<label className="flex flex-col gap-2">
					<span>Opacidad</span>
					<input
						type="range"
						min="0"
						max="100"
						value={config.opacity}
						onChange={handleChange('opacity')}
					/>
				</label>

				<label className="flex flex-col gap-2">
					<span>Modo de Mezcla</span>
					<select
						value={config.blendMode}
						onChange={(e) => onConfigChange({ blendMode: e.target.value as FilterConfig['blendMode'] })}
					>
						<option value="normal">Normal</option>
						<option value="multiply">Multiplicar</option>
						<option value="screen">Pantalla</option>
						<option value="overlay">Superponer</option>
					</select>
				</label>
			</div>
		</div>
	);
}

/**
 * Implementación de la capa de filtros
 * @type {LayerImplementation}
 */
export const filterLayerImplementation: LayerImplementation = {
	type: 'filter',
	name: 'Filtros',
	description: 'Aplica filtros y efectos visuales a la tarjeta',
	category: 'effects',
	defaultConfig,
	icon: <SlidersHorizontal size={16} />,
	compatibleEntityTypes: ['image', 'album', 'folder', 'tag', 'collection'],

	render: React.memo(({ config, isHovered, isActive }) => {
		// Procesar y validar configuración
		const processedConfig = React.useMemo(() => ({
			...defaultConfig,
			...(config as FilterConfig),
		}), [config]);

		// Usar hook personalizado para efectos visuales
		const { getFilterStyle } = useVisualEffects();

		// Calcular estilos de filtro
		const filterStyle = React.useMemo(() =>
			getFilterStyle(processedConfig),
			[getFilterStyle, processedConfig]);

		return (
			<FilterEffectLayer
				config={processedConfig}
				isHovered={isHovered || false}
				isActive={isActive || false}
				style={filterStyle}
			/>
		);
	}),

	Settings: React.memo(({ config, onChange, entityType, entityId }) => {
		// Manejar cambios de configuración de forma optimizada
		const handleConfigChange = React.useCallback((newConfig: FilterConfig) => {
			onChange(newConfig);
		}, [onChange]);

		return (
			<FilterSettings
				entityType={entityType}
				entityId={entityId}
				initialConfig={config as FilterConfig}
				onConfigChange={handleConfigChange}
			/>
		);
	}),

	// Funciones de servidor asociadas a la capa
	serverActions: {
		getConfig: getFilterConfig,
		updateConfig: updateFilterConfig,
		deleteConfig: deleteFilterConfig,
	},
};

// Exportar tipos y configuración por defecto
export { defaultFilterConfig };
export type { FilterConfig };
export default filterLayerImplementation;