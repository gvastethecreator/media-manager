'use client';

import { useEffect, useState } from 'react';
import { DesignPanel, designSystemToLegacy, legacyToDesignSystem } from '../../modules/design';
import type { DesignSystem } from '../../modules/design/types';
import type { CardOptions } from '../types';

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
	// Convertir opciones del formato antiguo al nuevo sistema
	const designSystem = legacyToDesignSystem(options);

	// Manejar cambios en el sistema de diseño
	const handleDesignChange = (newDesignSystem: DesignSystem) => {
		// Convertir de nuevo al formato antiguo
		const legacyOptions = designSystemToLegacy(newDesignSystem);

		// Actualizar opciones de la carta
		onChange({
			...options,
			designSystem: legacyOptions,
		});
	};

	return <DesignPanel designSystem={designSystem} onChange={handleDesignChange} disabled={disabled} />;
}
