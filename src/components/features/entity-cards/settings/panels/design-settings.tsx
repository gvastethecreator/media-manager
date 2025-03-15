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
	// Convertir opciones del formato antiguo al nuevo sistema usando un cast a any
	const designSystem = legacyToDesignSystem(options as any);

	// Manejar cambios en el sistema de diseño
	const handleDesignChange = (newDesignSystem: DesignSystem) => {
		// Convertir de nuevo al formato antiguo
		const legacyOptions = designSystemToLegacy(newDesignSystem);

		// Actualizar opciones de la carta usando un cast a any para evitar el error de tipo
		onChange({
			...options,
			designSystem: legacyOptions,
		} as any);
	};

	return <DesignPanel designSystem={designSystem} onChange={handleDesignChange} disabled={disabled} />;
}
