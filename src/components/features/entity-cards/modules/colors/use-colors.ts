'use client';

import { useCallback, useMemo } from 'react';
import type { ColorPalette, ColorsOptions } from './types';
import { COLOR_PALETTES, DEFAULT_COLORS_OPTIONS } from './types';

/**
 * Props para el hook useColors
 */
export interface UseColorsProps {
	initialOptions?: Partial<ColorsOptions>;
	onChange?: (options: ColorsOptions) => void;
	disabled?: boolean;
}

/**
 * Hook para gestionar las opciones de colores
 * @param props - Propiedades del hook
 * @returns Objeto con las opciones y métodos para manipularlas
 */
export function useColors(props: UseColorsProps = {}) {
	const { initialOptions = {}, onChange, disabled = false } = props;

	// Combinamos las opciones iniciales con las predeterminadas usando useMemo
	const options = useMemo(
		(): ColorsOptions => ({
			...DEFAULT_COLORS_OPTIONS,
			...initialOptions,
		}),
		[initialOptions]
	);

	/**
	 * Actualiza una propiedad específica
	 * @param key - Clave de la propiedad a actualizar
	 * @param value - Nuevo valor
	 */
	const updateOption = useCallback(
		(key: keyof ColorsOptions, value: unknown) => {
			const updatedOptions = {
				...options,
				[key]: value,
			};

			onChange?.(updatedOptions);
		},
		[options, onChange]
	);

	/**
	 * Actualiza la paleta de colores seleccionada
	 * @param palette - Paleta de colores a aplicar
	 */
	const updateColorPalette = useCallback(
		(palette: ColorPalette) => {
			const updatedOptions = {
				...options,
				colorPalette: palette.id,
				primaryColor: palette.primaryColor,
				secondaryColor: palette.secondaryColor,
				accentColor: palette.accentColor,
				backgroundStartColor: palette.backgroundStart,
				backgroundEndColor: palette.backgroundEnd,
				textColor: palette.textColor,
				borderColor: palette.borderColor,
			};

			onChange?.(updatedOptions);
		},
		[options, onChange]
	);

	/**
	 * Actualiza si se usan paletas de colores o colores personalizados
	 * @param useColorPalettes - Indicador de uso de paletas
	 */
	const toggleColorPalettes = useCallback(
		(useColorPalettes: boolean) => {
			updateOption('useColorPalettes', useColorPalettes);
		},
		[updateOption]
	);

	/**
	 * Encuentra la paleta de colores seleccionada actualmente
	 */
	const selectedPalette = useMemo(() => {
		const paletteId = options.colorPalette || 'modern-blue';
		return COLOR_PALETTES.find((palette) => palette.id === paletteId) || COLOR_PALETTES[0];
	}, [options.colorPalette]);

	return {
		// Estado
		options,
		colorPalettes: COLOR_PALETTES,
		selectedPalette,

		// Métodos para manipular el estado
		updateOption,
		updateColorPalette,
		toggleColorPalettes,

		// Propiedades adicionales
		disabled,
	};
}
