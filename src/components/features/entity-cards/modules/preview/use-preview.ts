'use client';

import { useCallback, useMemo } from 'react';
import type { PreviewOptions } from './types';
import { DEFAULT_PREVIEW_OPTIONS, PREVIEW_SIZE_OPTIONS } from './types';

/**
 * Props para el hook usePreview
 */
export interface UsePreviewProps {
	initialOptions?: Partial<PreviewOptions>;
	onChange?: (options: PreviewOptions) => void;
	disabled?: boolean;
}

/**
 * Hook para gestionar las opciones de previsualización
 * @param props - Propiedades del hook
 * @returns Objeto con las opciones y métodos para manipularlas
 */
export function usePreview(props: UsePreviewProps = {}) {
	const { initialOptions = {}, onChange, disabled = false } = props;

	// Combinamos las opciones iniciales con las predeterminadas usando useMemo
	const options = useMemo(
		(): PreviewOptions => ({
			...DEFAULT_PREVIEW_OPTIONS,
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
		(key: keyof PreviewOptions, value: unknown) => {
			const updatedOptions = {
				...options,
				[key]: value,
			};

			onChange?.(updatedOptions);
		},
		[options, onChange]
	);

	/**
	 * Calcula las dimensiones basadas en el tamaño seleccionado
	 */
	const dimensions = useMemo(() => {
		switch (options.size) {
			case 'small':
				return { width: 200, height: 300 };
			case 'medium':
				return { width: 300, height: 400 };
			case 'large':
				return { width: 400, height: 600 };
			case 'custom':
				return {
					width: options.customWidth || 300,
					height: options.customHeight || 400,
				};
			default:
				return { width: 300, height: 400 };
		}
	}, [options.size, options.customWidth, options.customHeight]);

	return {
		// Estado
		options,
		dimensions,

		// Constantes
		sizeOptions: PREVIEW_SIZE_OPTIONS,

		// Métodos para manipular el estado
		updateOption,

		// Propiedades adicionales
		disabled,
	};
}
