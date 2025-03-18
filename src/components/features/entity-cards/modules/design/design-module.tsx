'use client';

import { useEffect, useState } from 'react';
import { adaptDesignSystemToCardOptions } from './adapters';
import { DesignPanel } from './design-panel';
import type { DesignModuleProps, DesignSystem } from './types';

/**
 * Función auxiliar para combinar profundamente dos objetos
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
	const output = { ...target } as T;

	if (!source) return output;

	if (typeof source === 'object' && source !== null) {
		Object.keys(source as Record<string, any>).forEach((key) => {
			const targetValue = (target as Record<string, any>)[key];
			const sourceValue = (source as Record<string, any>)[key];

			if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue)) {
				if (typeof targetValue !== 'object' || targetValue === null) {
					(output as Record<string, any>)[key] = sourceValue;
				} else {
					(output as Record<string, any>)[key] = deepMerge(targetValue, sourceValue);
				}
			} else if (sourceValue !== undefined) {
				(output as Record<string, any>)[key] = sourceValue;
			}
		});
	}

	return output;
}

/**
 * 🎨 Configuración predeterminada para el sistema de diseño
 */
export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
	// Configuración general
	borderRadius: 12,
	padding: 16,
	aspectRatio: '1/1',
	maxWidth: 400,

	// Sombras y elevación
	elevation: 3,
	shadowColor: 'rgba(0, 0, 0, 0.25)',

	// Estilo de fondo
	backgroundColor: '#ffffff',
	backgroundOpacity: 1,
	backdropFilter: 'none',
	backdropBlurAmount: 0,

	// Bordes
	borderWidth: 1,
	borderStyle: 'solid',
	borderColor: 'rgba(0, 0, 0, 0.1)',

	// Avanzado
	customCssClasses: [],
	customCssVariables: {},

	// Propiedades adicionales para compatibilidad
	preset: 'default',
	variant: 'default',
	cornerStyle: 'rounded',
	cornerRadius: 12,
	shadowStyle: 'soft',
	colorScheme: 'auto',
	fontFamily: 'system-ui',
	surfaceStyle: 'regular',
	layoutDensity: 'comfortable',
	contentPadding: 'medium',
	glassEffect: false,
	accentColor: '#3b82f6',
	textColor: '#000000',
};

/**
 * 🎨 Módulo de diseño para Entity Cards
 *
 * Este módulo proporciona una interfaz para configurar el aspecto visual
 * de las tarjetas de entidad, incluyendo colores, bordes, estilos y más.
 */
export function DesignModule({
	initialDesignSystem = {},
	onChange,
	cardOptions,
	onCardOptionsChange,
}: DesignModuleProps) {
	// Estado del sistema de diseño
	const [designSystem, setDesignSystem] = useState<DesignSystem>(() =>
		deepMerge(DEFAULT_DESIGN_SYSTEM, initialDesignSystem)
	);

	// Actualizar el sistema de diseño cuando cambian las props
	useEffect(() => {
		setDesignSystem((prevSystem) => deepMerge(prevSystem, initialDesignSystem));
	}, [initialDesignSystem]);

	// Manejar cambios en el sistema de diseño
	const handleDesignSystemChange = (newDesignSystem: DesignSystem) => {
		setDesignSystem(newDesignSystem);
		onChange?.(newDesignSystem);

		// Actualizar las opciones de tarjeta si hay un manejador disponible
		if (onCardOptionsChange) {
			const updatedCardOptions = adaptDesignSystemToCardOptions(newDesignSystem);
			onCardOptionsChange(updatedCardOptions);
		}
	};

	return (
		<div className="space-y-4">
			<DesignPanel
				designSystem={designSystem}
				onChange={handleDesignSystemChange}
				cardOptions={cardOptions}
				onCardOptionsChange={onCardOptionsChange}
			/>
		</div>
	);
}
