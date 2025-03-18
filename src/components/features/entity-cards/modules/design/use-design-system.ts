'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_DESIGN_SYSTEM } from './design-module';
import type { DesignSystem, UseDesignSystemHook } from './types';

/**
 * Función auxiliar para convertir un color hex a RGB
 */
export function hexToRgb(hex: string): string {
	// Si no es un color hex válido, devolver blanco
	if (!hex.match(/^#([A-Fa-f0-9]{3}){1,2}$/)) {
		return '255, 255, 255';
	}

	// Expandir color hex corto (por ejemplo, #FFF a #FFFFFF)
	if (hex.length === 4) {
		hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
	}

	// Convertir a RGB
	const r = Number.parseInt(hex.substring(1, 3), 16);
	const g = Number.parseInt(hex.substring(3, 5), 16);
	const b = Number.parseInt(hex.substring(5, 7), 16);

	return `${r}, ${g}, ${b}`;
}

/**
 * 🎨 Hook personalizado para gestionar el estado del sistema de diseño
 * y generar estilos CSS basados en la configuración actual.
 */
export function useDesignSystem(initialDesignSystem?: Partial<DesignSystem>): UseDesignSystemHook {
	// Inicializar el estado con los valores predeterminados y los proporcionados
	const [designSystem, setDesignSystem] = useState<DesignSystem>({
		...DEFAULT_DESIGN_SYSTEM,
		...initialDesignSystem,
		// Asegurar que las propiedades críticas siempre estén definidas
		customCssClasses: initialDesignSystem?.customCssClasses || DEFAULT_DESIGN_SYSTEM.customCssClasses || [],
		customCssVariables: initialDesignSystem?.customCssVariables || DEFAULT_DESIGN_SYSTEM.customCssVariables || {},
	});

	// Función para actualizar el sistema de diseño
	const updateDesignSystem = useCallback((updates: Partial<DesignSystem>) => {
		setDesignSystem((prevState) => ({
			...prevState,
			...updates,
			// Asegurar que las propiedades críticas siempre estén definidas
			customCssClasses: updates.customCssClasses || prevState.customCssClasses || [],
			customCssVariables: updates.customCssVariables || prevState.customCssVariables || {},
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
			textColor,
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
			color: textColor || '#000000',
			position: 'relative',
			overflow: 'hidden',
			width: '100%',
			height: '100%',
			transition: 'all 0.3s ease',
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
