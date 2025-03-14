'use client';

import { useEffect, useState } from 'react';
import { StatesPanel } from './states-panel';
import type { StatesModuleProps, StatesSystem } from './types';

// Configuración predeterminada para el sistema de estados
export const DEFAULT_STATES_SYSTEM: StatesSystem = {
	hover: {
		scale: 1.02,
		rotate: true,
		lift: true,
		duration: 200,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	},
	active: {
		scale: 0.98,
		brightness: 0.95,
	},
	focus: {
		scale: 1.05,
		rotate: true,
		lift: true,
		duration: 200,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	},
	disabled: {
		opacity: 0.5,
		grayscale: true,
	},
	selected: {
		scale: 1.07,
		rotate: true,
		lift: true,
		brightness: 1.1,
		border: '2px solid currentColor',
	},
};

/**
 * Módulo para gestionar la configuración de estados interactivos de tarjetas
 * @param props Props del módulo
 * @returns Componente React
 */
export function StatesModule({ initialStatesSystem, onChange, disabled, className }: StatesModuleProps) {
	// Inicializar el estado del sistema con los valores predeterminados y los proporcionados
	const [statesSystem, setStatesSystem] = useState<StatesSystem>({
		...DEFAULT_STATES_SYSTEM,
		...initialStatesSystem,
	});

	// Actualizar el estado cuando cambien las props iniciales
	useEffect(() => {
		if (initialStatesSystem) {
			setStatesSystem((prevState) => ({
				...prevState,
				...initialStatesSystem,
			}));
		}
	}, [initialStatesSystem]);

	// Manejar cambios en el sistema de estados
	const handleStatesChange = (updatedSystem: StatesSystem) => {
		setStatesSystem(updatedSystem);
		onChange?.(updatedSystem);
	};

	return (
		<StatesPanel statesSystem={statesSystem} onChange={handleStatesChange} disabled={disabled} className={className} />
	);
}
