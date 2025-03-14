'use client';

import type { CardOptions } from '../../settings/types';
import { cardToPreviewOptions, updateCardWithPreviewOptions } from './preview-adapter';
import { PreviewModule } from './preview-module';

interface PreviewSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

/**
 * Componente adaptador para mantener compatibilidad con el panel antiguo
 */
export function PreviewSettings({ options, onChange, disabled = false }: PreviewSettingsProps) {
	// Convertimos del formato antiguo al nuevo
	const previewOptions = cardToPreviewOptions(options);

	// Manejador para actualizar las opciones en formato CardOptions
	const handlePreviewChange = (updatedOptions) => {
		const newOptions = updateCardWithPreviewOptions(options, updatedOptions);
		onChange(newOptions);
	};

	// Renderizamos el nuevo módulo
	return <PreviewModule initialOptions={previewOptions} onChange={handlePreviewChange} disabled={disabled} />;
}
