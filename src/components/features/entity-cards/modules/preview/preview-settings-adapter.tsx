'use client';

import type { CardOptions } from '../../types/card-settings-types';
import { PreviewModule } from './preview-module';
import type { PreviewOptions } from './types';

interface PreviewSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

/**
 * Componente adaptador para mantener compatibilidad con el panel antiguo
 */
export function PreviewSettings({ options, onChange, disabled = false }: PreviewSettingsProps) {
	// Extraer las opciones de preview o crear un objeto vacío si no existen
	const preview = options.preview || {};

	// Convertir a formato PreviewOptions
	const previewOptions: PreviewOptions = {
		size: preview.size || 'medium',
		customWidth: preview.customWidth || 300,
		customHeight: preview.customHeight || 400,
		showControls: preview.showControls ?? true,
		showInfo: preview.showInfo ?? true,
		showBorder: preview.showBorder ?? true,
		backgroundColor: preview.backgroundColor || 'transparent',
		enableInteraction: preview.enableInteraction ?? true,
		autoRotate: preview.autoRotate ?? false,
		rotationSpeed: preview.rotationSpeed || 1,
		zoomLevel: preview.zoomLevel || 1,
	};

	// Manejador para actualizar las opciones en formato CardOptions
	const handlePreviewChange = (updatedOptions: PreviewOptions) => {
		const newOptions = {
			...options,
			preview: {
				...options.preview,
				...updatedOptions,
			},
		};
		onChange(newOptions);
	};

	// Renderizamos el nuevo módulo
	return <PreviewModule initialOptions={previewOptions} onChange={handlePreviewChange} disabled={disabled} />;
}
