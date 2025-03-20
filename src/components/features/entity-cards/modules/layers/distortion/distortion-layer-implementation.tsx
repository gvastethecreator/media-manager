'use client';

/**
 * 🌈 Implementación de capa de distorsión
 *
 * Este archivo define la implementación de la capa de distorsión
 * siguiendo la interfaz LayerImplementation definida en el sistema de capas.
 */

import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LayerImplementation, LayerRenderProps, LayerSettingsProps } from '../types';
import { DistortionEffectsModule } from './distortion-effects-module';
import type { DistortionEffectsSystem } from './types';
import { useDistortionEffects } from './use-distortion-effects';

/**
 * Configuración por defecto para la capa de distorsión
 */
const defaultConfig: DistortionEffectsSystem & { layerIndex: number } = {
	enabled: false,
	visibleOnHover: true,
	intensity: 0.5,
	glitchEffect: {
		enabled: false,
		visibleOnHover: true,
		intensity: 0.3,
		frequency: 0.05,
		duration: 0.2,
	},
	chromaticAberration: {
		enabled: false,
		visibleOnHover: true,
		intensity: 0.5,
		offset: 2,
	},
	pixelate: {
		enabled: false,
		visibleOnHover: true,
		intensity: 0.5,
		blockSize: 8,
	},
	layerIndex: 5
};

/**
 * Componente que renderiza los efectos de distorsión
 */
function DistortionEffectLayer({
	config,
	isHovered,
	isExploded,
	getExplodeLayerTransform,
	activeLayer
}: {
	config: DistortionEffectsSystem & { layerIndex: number };
	isHovered: boolean;
	isExploded: boolean;
	getExplodeLayerTransform: (index: number) => React.CSSProperties;
	activeLayer: string | null;
}) {
	const { generateEffectClasses } = useDistortionEffects({ initialEffects: config });
	const effectClasses = generateEffectClasses(isHovered);

	if (!config.enabled) {
		return null;
	}

	// Si no hay ningún efecto habilitado, no renderizar nada
	if (!config.glitchEffect.enabled && !config.chromaticAberration.enabled && !config.pixelate.enabled) {
		return null;
	}

	// Si solo debe mostrarse en hover y no está en hover, no renderizar
	if (config.visibleOnHover && !isHovered) {
		return null;
	}

	return (
		<div
			className={cn(
				'absolute inset-0 pointer-events-none z-25',
				effectClasses,
				isExploded ? 'exploded-layer layer-distortion' : ''
			)}
			style={isExploded ? getExplodeLayerTransform(config.layerIndex || 5) : {}}
			data-layer-active={activeLayer === 'distortion' || null}
		/>
	);
}

/**
 * Implementación de la capa de distorsión
 */
export const distortionLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'distortion',

	// Nombre amigable para mostrar en la UI
	name: 'Distorsión',

	// Descripción de la funcionalidad
	description: 'Añade efectos de distorsión como glitch, aberración cromática y pixelado',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: <Zap size={16} />,

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'folder', 'album', 'tag', 'collection'],

	// Función para renderizar la capa
	render: (props: LayerRenderProps) => {
		const { config, isHovered, isActive, isExploded } = props;

		const effectConfig = {
			...defaultConfig,
			...config
		} as DistortionEffectsSystem & { layerIndex: number };

		// Función para calcular el estilo de transformación para capas explotadas
		const getExplodeTransform = (index: number): React.CSSProperties => {
			const offset = 20 * index;
			return {
				transform: `translate3d(${offset}px, ${offset}px, 0)`,
				zIndex: 10 + index,
			};
		};

		// Pasar la configuración al componente de efecto
		return (
			<DistortionEffectLayer
				config={effectConfig}
				isHovered={!!isHovered}
				isExploded={!!isExploded}
				getExplodeLayerTransform={getExplodeTransform}
				activeLayer={isActive ? 'distortion' : null}
			/>
		);
	},

	// Componente para configurar la capa
	Settings: (props: LayerSettingsProps) => {
		const { config, onChange, entityType, entityId } = props;
		const [effectsSystem, setEffectsSystem] = useState<DistortionEffectsSystem & { layerIndex: number }>({
			...defaultConfig,
			...(config as unknown as DistortionEffectsSystem)
		});

		// Actualizar el estado cuando cambien las props
		useEffect(() => {
			if (config) {
				setEffectsSystem(prevState => ({
					...prevState,
					...config
				}));
			}
		}, [config]);

		// Manejar cambios en la configuración
		const handleChange = (updatedSystem: DistortionEffectsSystem) => {
			setEffectsSystem({
				...updatedSystem,
				layerIndex: effectsSystem.layerIndex
			} as DistortionEffectsSystem & { layerIndex: number });
			onChange({
				...updatedSystem,
				layerIndex: effectsSystem.layerIndex
			} as unknown as Record<string, unknown>);
		};

		return (
			<DistortionEffectsModule
				initialEffectsSystem={effectsSystem}
				onChange={handleChange}
				className="mt-4"
			/>
		);
	}
};

/**
 * Exportar el componente por defecto
 */
export default distortionLayerImplementation;