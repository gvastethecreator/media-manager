'use client';

/**
 * 🌈 Implementación de capa de filtros
 *
 * Este archivo define la implementación de la capa de filtros
 * siguiendo la interfaz LayerImplementation definida en el sistema de capas.
 */

import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type LayerImplementation, type LayerRenderProps, type LayerSettingsProps } from '../types';
import type { FilterConfig } from './actions/filter-config.action';
import { FilterEffectLayer } from './filter-effect-layer';
import { FilterSettings } from './filter-settings';

/**
 * Configuración por defecto para la capa de filtros
 */
const defaultConfig: FilterConfig = {
	enabled: true,
	visibleOnHover: false,
	opacity: 1,
	intensity: 1,
	glow: {
		enabled: false,
		color: 'rgba(0, 0, 255, 0.3)',
		radius: 10,
		intensity: 0.5,
	},
	shadow: {
		enabled: true,
		color: 'rgba(0, 0, 0, 0.3)',
		blur: 5,
		offsetX: 0,
		offsetY: 5,
		inset: false,
	},
	distortion: {
		enabled: false,
		type: 'wave',
		amount: 5,
		speed: 1,
		animated: false,
	},
	layerIndex: 5,
};

/**
 * Implementación de la capa de filtros
 */
export const filterLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'filter',

	// Nombre amigable para mostrar en la UI
	name: 'Filtros',

	// Descripción de la funcionalidad
	description: 'Aplica efectos visuales como sombras, resplandor y distorsión',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: <Filter size={16} />,

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'folder', 'album', 'tag', 'collection'],

	// Función para renderizar la capa
	render: (props: LayerRenderProps) => {
		const { config, isHovered, isActive, isExploded, entityType } = props;

		// Función para calcular el estilo de transformación para capas explotadas
		const getExplodeTransform = (index: number): React.CSSProperties => {
			const offset = 20 * index;
			return {
				transform: `translate3d(${offset}px, ${offset}px, 0)`,
				zIndex: 10 + index,
			};
		};

		const filterConfig = {
			...defaultConfig,
			...config,
		} as FilterConfig;

		return (
			<div className={cn(
				'filter-layer-container',
				isActive ? 'filter-layer-active' : '',
			)}>
				<FilterEffectLayer
					config={filterConfig}
					isExploded={!!isExploded}
					isHovered={!!isHovered}
					activeLayer={isActive ? 'filter' : null}
					getExplodeLayerTransform={getExplodeTransform}
				/>
			</div>
		);
	},

	// Componente para configurar la capa
	Settings: (props: LayerSettingsProps) => {
		const { config, onChange, entityType, entityId } = props;
		const [filterConfig, setFilterConfig] = useState<FilterConfig>({
			...defaultConfig,
			...(config as FilterConfig)
		});

		// Actualizar el estado cuando cambien las props
		useEffect(() => {
			if (config) {
				setFilterConfig(prevState => ({
					...prevState,
					...config
				}) as FilterConfig);
			}
		}, [config]);

		// Manejar cambios en la configuración
		const handleChange = (newConfig: Partial<FilterConfig>) => {
			const updatedConfig = {
				...filterConfig,
				...newConfig,
			};

			setFilterConfig(updatedConfig);
			onChange(updatedConfig);
		};

		return (
			<FilterSettings
				config={filterConfig}
				onChange={handleChange}
				entityType={entityType}
				entityId={entityId}
			/>
		);
	}
};

/**
 * Exportar el componente por defecto
 */
export default filterLayerImplementation;