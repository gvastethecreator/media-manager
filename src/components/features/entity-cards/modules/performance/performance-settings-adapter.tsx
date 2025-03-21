'use client';

import type { CardOptions } from '../../settings-old/types';
import { legacyToPerformanceOptions, updateCardWithPerformanceOptions } from './performance-adapter';
import { PerformanceModule } from './performance-module';

/**
 * Componente adaptador para mantener compatibilidad con el panel antiguo
 */
export function PerformanceSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Convertimos del formato antiguo al nuevo
	const performanceOptions = legacyToPerformanceOptions(options);

	// Manejador para actualizar las opciones en formato CardOptions
	const handlePerformanceChange = (updatedOptions) => {
		const newOptions = updateCardWithPerformanceOptions(options, updatedOptions);
		onChange(newOptions);
	};

	// Renderizamos el nuevo módulo
	return (
		<PerformanceModule initialOptions={performanceOptions} onChange={handlePerformanceChange} disabled={disabled} />
	);
}
