'use client';

import type { CardOptions } from '../../settings-old/types';
import { cardToColorsOptions, updateCardWithColorsOptions } from './colors-adapter';
import { ColorsModule } from './colors-module';

interface ColorsSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

/**
 * Componente adaptador para mantener compatibilidad con el panel antiguo
 */
export function ColorsSettings({ options, onChange, disabled = false }: ColorsSettingsProps) {
	// Convertimos del formato antiguo al nuevo
	const colorsOptions = cardToColorsOptions(options);

	// Manejador para actualizar las opciones en formato CardOptions
	const handleColorsChange = (updatedOptions) => {
		const newOptions = updateCardWithColorsOptions(options, updatedOptions);
		onChange(newOptions);
	};

	// Renderizamos el nuevo módulo
	return <ColorsModule initialOptions={colorsOptions} onChange={handleColorsChange} disabled={disabled} />;
}
