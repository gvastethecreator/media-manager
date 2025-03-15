'use client';

import {
	BacksidePanel,
	backsideSystemToLegacy,
	legacyToBacksideSystem,
} from '@/components/features/entity-cards/modules/backside';
import type { BacksideOptions } from '@/components/features/entity-cards/modules/backside/types';
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
	// Convertir opciones del formato antiguo al nuevo sistema usando un cast a any
	const backsideSystem = legacyToBacksideSystem(options as any);

	// Manejar cambios en el sistema de backside
	const handleBacksideChange = (newBacksideSystem: BacksideOptions) => {
		// Convertir de nuevo al formato antiguo
		const legacyOptions = backsideSystemToLegacy(newBacksideSystem);

		// Actualizar opciones de la carta
		onChange({
			...options,
			backside: legacyOptions,
		} as any);
	};

	return <BacksidePanel options={backsideSystem} onChange={handleBacksideChange as any} disabled={disabled} />;
}
