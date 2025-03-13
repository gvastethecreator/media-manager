'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useMemo } from 'react';
import { DEFAULT_SETTINGS_OPTIONS } from '../config/card-config-defaults';
import type {
	CardOptions as BaseCardOptions,
	CardDesignPreset,
	RarityConfig,
	TextureConfig,
} from '../types/base-card-types';
import type { CardOptions as SettingsCardOptions } from '../types/card-settings-types';
import { BaseCard } from './base-card';
import { adaptOptionsForLayout, adaptSettingsToBaseOptions, isSettingsCardOptions } from './card-adapter';

export interface EntityCardWrapperProps {
	// Propiedades comunes
	children: React.ReactNode;
	className?: string;
	options?: Partial<BaseCardOptions> | Partial<SettingsCardOptions>;
	entityType: CardDesignPreset;

	// Configuraciones visuales
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;

	// Interacciones
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;

	// Configuración visual
	showVisualizationConfig?: boolean;
	onVisualizationConfigClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

	// Soporte para modo explosionado
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	explodeLayers?: {
		id: string;
		label: string;
		icon: React.ReactNode;
	}[];
}

/**
 * EntityCardWrapper - Componente que conecta los layouts específicos con el BaseCard
 *
 * Este componente gestiona:
 * 1. La adaptación de opciones según el tipo de entidad
 * 2. La configuración de aspectos como rareza y textura
 * 3. Compatibilidad de props entre layouts y BaseCard
 */
export function EntityCardWrapper({
	children,
	className,
	options = DEFAULT_SETTINGS_OPTIONS as unknown as Partial<BaseCardOptions>,
	entityType,
	rarity,
	texture,
	onClick,
	onHoverStart,
	onHoverEnd,
	showVisualizationConfig = false,
	onVisualizationConfigClick,
	enableExplode = false,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
	explodeLayers = [],
}: EntityCardWrapperProps) {
	// Convertir las opciones al formato correcto dependiendo del tipo
	const baseOptions = useMemo(() => {
		if (isSettingsCardOptions(options)) {
			// Si son opciones del tipo Settings, convertirlas a BaseOptions
			return adaptSettingsToBaseOptions(options as SettingsCardOptions);
		}
		// Si ya son opciones de tipo Base, usarlas directamente
		return options as Partial<BaseCardOptions>;
	}, [options]);

	// Configurar la rareza con valores predeterminados si es necesario
	const defaultRarity: RarityConfig = rarity || {
		name: 'common',
		color: '#3b82f6',
		borderWidth: '1px',
		borderEffect: 'static',
	};

	// Adaptar las opciones para el tipo específico de layout
	const adaptedOptions = useMemo(() => {
		const options = adaptOptionsForLayout(baseOptions, entityType);
		// Asegurar que las opciones de rareza están correctamente configuradas
		if (rarity && options.raritySystem !== undefined && options.raritySystem?.enabled !== false) {
			options.raritySystem = { enabled: true };
		}
		return options;
	}, [baseOptions, entityType, rarity]);

	return (
		<BaseCard
			className={cn(
				'w-full',
				{
					// Aplicar aspecto según el preset configurado
					'aspect-[3/4]': adaptedOptions.designSystem?.aspectRatio === '3/4',
					'aspect-[4/5]': adaptedOptions.designSystem?.aspectRatio === '4/5',
					'aspect-[7/10]': adaptedOptions.designSystem?.aspectRatio === '7/10',
					'aspect-square': adaptedOptions.designSystem?.aspectRatio === '1/1',
					'aspect-video': adaptedOptions.designSystem?.aspectRatio === '16/9',
				},
				className
			)}
			options={adaptedOptions}
			rarity={defaultRarity}
			texture={texture || undefined}
			onClick={onClick}
			onHoverStart={onHoverStart}
			onHoverEnd={onHoverEnd}
			showVisualizationConfig={showVisualizationConfig}
			onVisualizationConfigClick={onVisualizationConfigClick}
			enableExplode={enableExplode}
			explodeLayers={explodeLayers}
			isExploded={isExploded}
			activeLayer={activeLayer}
			onExplodedChange={onExplodedChange}
			onActiveLayerChange={onActiveLayerChange}
		>
			{children}
		</BaseCard>
	);
}
