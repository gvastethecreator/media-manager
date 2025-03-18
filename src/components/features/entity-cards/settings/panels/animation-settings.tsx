'use client';

import {
	AnimationPanel,
	animationSystemToLegacy,
	legacyToAnimationSystem,
} from '@/components/features/entity-cards/modules/animation';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';

/**
 * @deprecated Use AnimationPanel from @/components/features/entity-cards/modules/animation instead
 * Componente de compatibilidad para mantener la API anterior mientras se migra al nuevo sistema
 */
export function AnimationSettings({
	cardOptions,
	onCardOptionsChange,
	disabled = false,
}: {
	cardOptions: CardOptions;
	onCardOptionsChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Convertir opciones del formato antiguo al nuevo sistema usando un cast a tipos parciales
	const animationSystem = legacyToAnimationSystem(cardOptions as Record<string, unknown>);

	// Manejar cambios en el sistema de animación
	const handleAnimationChange = (newSystem: Record<string, unknown>) => {
		// Convertir de nuevo al formato antiguo para mantener compatibilidad
		const legacyOptions = animationSystemToLegacy(newSystem);

		// Actualizar las opciones con el formato legacy
		onCardOptionsChange({
			...cardOptions,
			animation: legacyOptions,
		} as Record<string, unknown>);
	};

	return <AnimationPanel animationSystem={animationSystem} onChange={handleAnimationChange} disabled={disabled} />;
}
