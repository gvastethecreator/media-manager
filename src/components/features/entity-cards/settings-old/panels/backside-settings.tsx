'use client';

import {
	BacksidePanel,
	backsideSystemToLegacy,
	legacyToBacksideSystem,
} from '@/components/features/entity-cards/modules/backside';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';

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
	// Convertir opciones del formato antiguo al nuevo sistema usando un cast a tipos parciales
	const backsideSystem = legacyToBacksideSystem(options as Record<string, unknown>);

	// Manejar cambios en el sistema de backside
	const handleBacksideChange = (newSystem: Record<string, unknown>) => {
		// Convertir de nuevo al formato antiguo para mantener compatibilidad
		const legacyOptions = backsideSystemToLegacy(newSystem);

		// Actualizar opciones con el formato legacy
		onChange({
			...options,
			backside: legacyOptions,
		} as Record<string, unknown>);
	};

	return (
		<BacksidePanel
			options={backsideSystem}
			onChange={handleBacksideChange as (config: Record<string, unknown>) => void}
			disabled={disabled}
		/>
	);
}
