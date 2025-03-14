'use client';

import { useEffect, useState } from 'react';
import { BacksidePanel, backsideSystemToLegacy, legacyToBacksideSystem } from '../../modules/backside';
import type { BacksideOptions } from '../../modules/backside/types';
import type { CardOptions } from '../types';

/**
 * @deprecated Use BacksidePanel from @/components/features/entity-cards/modules/backside instead
 * Componente de compatibilidad para mantener la API anterior mientras se migra al nuevo sistema
 */
export function BacksideSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Convertir opciones del formato antiguo al nuevo sistema
	const backsideSystem = legacyToBacksideSystem(options);

	// Manejar cambios en el sistema de backside
	const handleBacksideChange = (newBacksideSystem: BacksideOptions) => {
		// Convertir de nuevo al formato antiguo
		const legacyOptions = backsideSystemToLegacy(newBacksideSystem);

		// Actualizar opciones de la carta
		onChange({
			...options,
			backside: legacyOptions,
		});
	};

	return <BacksidePanel options={backsideSystem} onChange={handleBacksideChange} disabled={disabled} />;
}
