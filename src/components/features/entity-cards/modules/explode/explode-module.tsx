'use client';

import { useEffect, useState } from 'react';
import { ExplodePanel } from './explode-panel';
import type { ExplodeModuleProps, ExplodeSystem } from './types';

// Configuración predeterminada para el sistema de explosión
export const DEFAULT_EXPLODE_SYSTEM: ExplodeSystem = {
	enabled: false,
	distance: 20,
	direction: '3d',
	perspective: 1000,
	rotationX: 0,
	rotationY: 0,
	rotationZ: 0,
	animated: true,
	animationDuration: 500,
	staggered: true,
	staggerDelay: 50,
	showLabels: true,
	autoRotate: false,
	autoRotateSpeed: 1,
	centerLayer: '',
	expandOnHover: true,
	hoverExpandFactor: 1.2,
};

export function ExplodeModule({ initialExplodeSystem, layersList, onChange, disabled, className }: ExplodeModuleProps) {
	// Inicializar el estado del sistema de explosión con los valores predeterminados y los proporcionados
	const [explodeSystem, setExplodeSystem] = useState<ExplodeSystem>({
		...DEFAULT_EXPLODE_SYSTEM,
		...initialExplodeSystem,
	});

	// Actualizar el estado cuando cambien las props iniciales
	useEffect(() => {
		if (initialExplodeSystem) {
			setExplodeSystem((prevState) => ({
				...prevState,
				...initialExplodeSystem,
			}));
		}
	}, [initialExplodeSystem]);

	// Manejar cambios en el sistema de explosión
	const handleExplodeChange = (updatedSystem: ExplodeSystem) => {
		setExplodeSystem(updatedSystem);
		onChange?.(updatedSystem);
	};

	return (
		<ExplodePanel
			explodeSystem={explodeSystem}
			onChange={handleExplodeChange}
			layersList={layersList}
			disabled={disabled}
			className={className}
		/>
	);
}
