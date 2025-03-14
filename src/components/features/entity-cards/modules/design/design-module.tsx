'use client';

import { useEffect, useState } from 'react';
import { DesignPanel } from './design-panel';
import type { DesignModuleProps, DesignSystem } from './types';

// Configuración predeterminada para el sistema de diseño
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
};

/**
 * Módulo para gestionar la configuración de diseño de tarjetas
 */
export function DesignModule({ initialDesignSystem, onChange, disabled, className }: DesignModuleProps) {
	// Inicializar el estado del sistema de diseño con los valores predeterminados y los proporcionados
	const [designSystem, setDesignSystem] = useState<DesignSystem>({
		...DEFAULT_DESIGN_SYSTEM,
		...initialDesignSystem,
	});

	// Actualizar el estado cuando cambien las props iniciales
	useEffect(() => {
		if (initialDesignSystem) {
			setDesignSystem((prevState) => ({
				...prevState,
				...initialDesignSystem,
			}));
		}
	}, [initialDesignSystem]);

	// Manejar cambios en el sistema de diseño
	const handleDesignChange = (updatedSystem: DesignSystem) => {
		setDesignSystem(updatedSystem);
		onChange?.(updatedSystem);
	};

	return (
		<DesignPanel designSystem={designSystem} onChange={handleDesignChange} disabled={disabled} className={className} />
	);
}
