'use client';

import type { EntityType } from '../../adapters/preset-adapter';
import type { RarityConfig, TextureConfig } from '../../types/base-card-types';
import type { CardOptions } from '../../types/card-settings-types';
import { PreviewModule } from './preview-module';
import type { PreviewOptions } from './types';

// Interfaz para la forma original de props
interface PreviewSettingsPropsOriginal {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

// Interfaz para la nueva forma de props con múltiples parámetros
interface PreviewSettingsPropsExtended {
	cardOptions: CardOptions;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	entityType: EntityType;
	activeLayerId?: string | null;
	isExploded?: boolean;
	onExplodedChange?: (value: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
}

// Tipo unión para representar ambas formas de props
type PreviewSettingsProps = PreviewSettingsPropsOriginal | PreviewSettingsPropsExtended;

// Función auxiliar para determinar qué tipo de props se está recibiendo
function isOriginalProps(props: PreviewSettingsProps): props is PreviewSettingsPropsOriginal {
	return 'options' in props && 'onChange' in props;
}

/**
 * Componente adaptador para mantener compatibilidad con el panel antiguo
 */
export function PreviewSettings(props: PreviewSettingsProps) {
	// Determinar qué tipo de props tenemos y extraer las opciones adecuadamente
	if (isOriginalProps(props)) {
		// Caso 1: Formato original con options y onChange
		const { options, onChange, disabled = false } = props;

		// Extraer las opciones de preview o crear un objeto vacío si no existen
		const preview = options.preview || ({} as Partial<PreviewOptions>);

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
					...(options.preview as Partial<PreviewOptions>),
					...updatedOptions,
				},
			};
			onChange(newOptions);
		};

		// Renderizamos el nuevo módulo
		return <PreviewModule initialOptions={previewOptions} onChange={handlePreviewChange} disabled={disabled} />;
	}
	// Caso 2: Formato extendido con cardOptions, rarity, texture, etc.
	const { cardOptions, rarity, texture, entityType, activeLayerId, isExploded, onExplodedChange, onActiveLayerChange } =
		props;

	// Extraer las opciones de preview o crear un objeto vacío si no existen
	const preview = cardOptions.preview || ({} as Partial<PreviewOptions>);

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

	// Renderizamos el módulo con parámetros extendidos
	// Nota: aquí simplemente pasamos las opciones sin manejador de cambios
	// ya que en este caso el componente se usa solo para visualización
	return (
		<PreviewModule
			initialOptions={previewOptions}
			disabled={false}
			rarity={rarity}
			texture={texture}
			entityType={entityType}
			activeLayerId={activeLayerId}
			isExploded={isExploded}
			onExplodedChange={onExplodedChange}
			onActiveLayerChange={onActiveLayerChange}
		/>
	);
}
