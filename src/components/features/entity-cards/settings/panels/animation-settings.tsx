'use client';

import {
	AnimationPanel,
	animationSystemToLegacy,
	legacyToAnimationSystem,
} from '@/components/features/entity-cards/modules/animation';
import type { AnimationSystem } from '@/components/features/entity-cards/modules/animation/types';
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
	// Convertir opciones del formato antiguo al nuevo sistema usando un cast a any
	const animationSystem = legacyToAnimationSystem(cardOptions as any);

	// Manejar cambios en el sistema de animación
	const handleAnimationChange = (newAnimationSystem: AnimationSystem) => {
		// Convertir de nuevo al formato antiguo
		const legacyOptions = animationSystemToLegacy(newAnimationSystem);

		// Actualizar opciones de la carta
		onCardOptionsChange({
			...cardOptions,
			animation: legacyOptions,
		} as any);
	};

	return <AnimationPanel animationSystem={animationSystem} onChange={handleAnimationChange} disabled={disabled} />;
}
