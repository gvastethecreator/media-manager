'use client';

import {
	DesignPanel,
	designSystemToLegacy,
	legacyToDesignSystem,
} from '@/components/features/entity-cards/modules/design';
import type { DesignSystem } from '@/components/features/entity-cards/modules/design/types';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';

/**
 * @deprecated Use DesignPanel from @/components/features/entity-cards/modules/design instead
 * Componente de compatibilidad para mantener la API anterior mientras se migra al nuevo sistema
 */
export function DesignSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Convertir opciones del formato antiguo al nuevo sistema usando un cast a tipos parciales
	const designSystem = legacyToDesignSystem(options as Record<string, unknown>);

	// Manejar cambios en el sistema de diseño
	const handleDesignChange = (newSystem: Record<string, unknown>) => {
		// Convertir de nuevo al formato antiguo para mantener compatibilidad
		const legacyOptions = designSystemToLegacy(newSystem);

		// Actualizar opciones con el formato legacy
		onChange({
			...options,
			designSystem: legacyOptions,
		} as Record<string, unknown>);
	};

	return <DesignPanel designSystem={designSystem} onChange={handleDesignChange} disabled={disabled} />;
}
