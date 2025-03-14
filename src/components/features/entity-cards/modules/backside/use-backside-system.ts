'use client';

import { useEffect, useState } from 'react';
import type { BacksideOptions, BacksideSystemProps } from './types';

/**
 * Hook para gestionar el sistema de backside de las cartas
 * @param initialOptions Opciones iniciales de backside
 * @param onChange Función para manejar cambios en las opciones
 * @param disabled Estado de deshabilitado
 */
export function useBacksideSystem({ options, onChange, disabled = false }: BacksideSystemProps) {
	const [backsideOptions, setBacksideOptions] = useState<BacksideOptions>(
		options.backside || {
			enabled: false,
			layoutType: 'standard',
			colorMode: 'inherit',
			opacity: 0.9,
			blurBackground: false,
			blurAmount: 5,
			showAttributes: true,
			showDescription: true,
			showStats: true,
			showMetadata: false,
			showRelations: false,
			maxDescriptionLength: 250,
			flipAnimation: 'flip',
			flipDuration: 0.6,
			enableAutoFlip: false,
			autoFlipDelay: 3,
			flipTrigger: 'hover',
			headingStyle: 'large',
			infoStyle: 'compact',
			separatorStyle: 'gradient',
		}
	);

	// Sincronizar estado cuando cambian las opciones externas
	useEffect(() => {
		if (options.backside) {
			setBacksideOptions(options.backside);
		}
	}, [options.backside]);

	// Manejar cambios en las opciones de backside
	const handleBacksideChange = (key: keyof BacksideOptions, value: unknown) => {
		if (disabled) {
			return;
		}

		const updatedOptions = {
			...backsideOptions,
			[key]: value,
		};

		setBacksideOptions(updatedOptions);

		onChange({
			...options,
			backside: updatedOptions,
		});
	};

	return {
		backsideOptions,
		handleBacksideChange,
		disabled,
	};
}
