'use client';

import { useEffect, useState } from 'react';
import { DistortionEffectsPanel } from './distortion-effects-panel';
import type { DistortionEffectsModuleProps, DistortionEffectsSystem } from './types';

// Configuración predeterminada para el sistema de efectos de distorsión
export const DEFAULT_DISTORTION_EFFECTS_SYSTEM: DistortionEffectsSystem = {
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
};

/**
 * Módulo para gestionar los efectos de distorsión en las tarjetas
 * @param props Props del módulo
 * @returns Componente React
 */
export function DistortionEffectsModule({
	initialEffectsSystem,
	onChange,
	disabled,
	className,
}: DistortionEffectsModuleProps) {
	// Inicializar el estado del sistema con los valores predeterminados y los proporcionados
	const [effectsSystem, setEffectsSystem] = useState<DistortionEffectsSystem>({
		...DEFAULT_DISTORTION_EFFECTS_SYSTEM,
		...initialEffectsSystem,
	});

	// Actualizar el estado cuando cambien las props iniciales
	useEffect(() => {
		if (initialEffectsSystem) {
			setEffectsSystem((prevState) => ({
				...prevState,
				...initialEffectsSystem,
			}));
		}
	}, [initialEffectsSystem]);

	// Manejar cambios en el sistema de efectos
	const handleEffectsChange = (updatedSystem: DistortionEffectsSystem) => {
		setEffectsSystem(updatedSystem);
		onChange?.(updatedSystem);
	};

	return (
		<DistortionEffectsPanel
			effectsSystem={effectsSystem}
			onChange={handleEffectsChange}
			disabled={disabled}
			className={className}
		/>
	);
}
