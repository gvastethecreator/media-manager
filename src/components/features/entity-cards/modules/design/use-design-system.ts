'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_DESIGN_SYSTEM } from './design-module';
import type { DesignSystem, UseDesignSystemHook } from './types';

/**
 * Hook personalizado para gestionar el estado del sistema de diseño
 * y generar estilos CSS basados en la configuración actual.
 */
export function useDesignSystem(initialDesignSystem?: Partial<DesignSystem>): UseDesignSystemHook {
	// Inicializar el estado con los valores predeterminados y los proporcionados
	const [designSystem, setDesignSystem] = useState<DesignSystem>({
		...DEFAULT_DESIGN_SYSTEM,
		...initialDesignSystem,
	});

	// Función para actualizar el sistema de diseño
	const updateDesignSystem = useCallback((updates: Partial<DesignSystem>) => {
		setDesignSystem((prevState) => ({
			...prevState,
			...updates,
		}));
	}, []);

	// Función para restablecer el sistema de diseño a los valores predeterminados
	const resetDesignSystem = useCallback(() => {
		setDesignSystem(DEFAULT_DESIGN_SYSTEM);
	}, []);

	// Función para generar estilos CSS basados en la configuración actual
	const generateCssStyles = useCallback(() => {
		const {
			borderRadius,
			padding,
			aspectRatio,
			maxWidth,
			elevation,
			shadowColor,
			backgroundColor,
			backgroundOpacity,
			backdropFilter,
			backdropBlurAmount,
			borderWidth,
			borderStyle,
			borderColor,
			customCssVariables,
		} = designSystem;

		// Generar sombra basada en la elevación
		const generateShadow = (level: number, color: string) => {
			switch (level) {
				case 0:
					return 'none';
				case 1:
					return `0 2px 4px ${color}`;
				case 2:
					return `0 4px 8px ${color}`;
				case 3:
					return `0 8px 16px ${color}`;
				case 4:
					return `0 12px 24px ${color}`;
				case 5:
					return `0 16px 32px ${color}`;
				default:
					return `0 8px 16px ${color}`;
			}
		};

		// Generar filtro de fondo
		const generateBackdropFilter = () => {
			if (backdropFilter === 'blur' && backdropBlurAmount > 0) {
				return `blur(${backdropBlurAmount}px)`;
			}
			return backdropFilter !== 'none' ? backdropFilter : 'none';
		};

		// Construir el objeto de estilos CSS
		const styles: Record<string, string> = {
			borderRadius: `${borderRadius}px`,
			padding: `${padding}px`,
			aspectRatio,
			maxWidth: `${maxWidth}px`,
			boxShadow: generateShadow(elevation, shadowColor),
			backgroundColor:
				backgroundOpacity < 1 ? `rgba(${hexToRgb(backgroundColor)}, ${backgroundOpacity})` : backgroundColor,
			backdropFilter: generateBackdropFilter(),
			borderWidth: `${borderWidth}px`,
			borderStyle,
			borderColor,
		};

		// Agregar variables CSS personalizadas
		Object.entries(customCssVariables).forEach(([key, value]) => {
			styles[`--${key}`] = value;
		});

		return styles;
	}, [designSystem]);

	return {
		designSystem,
		updateDesignSystem,
		resetDesignSystem,
		generateCssStyles,
	};
}

// Función auxiliar para convertir color hexadecimal a RGB
function hexToRgb(hex: string): string {
	// Eliminar el # si está presente
	const cleanHex = hex.replace('#', '');

	// Convertir a valores RGB
	const r = Number.parseInt(cleanHex.substring(0, 2), 16);
	const g = Number.parseInt(cleanHex.substring(2, 4), 16);
	const b = Number.parseInt(cleanHex.substring(4, 6), 16);

	// Devolver formato RGB
	return `${r}, ${g}, ${b}`;
}
