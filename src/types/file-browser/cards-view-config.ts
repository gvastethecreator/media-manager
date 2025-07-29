import type { AnyEntityWithStats } from '@/types/entities';
import type {
	CardsViewConfig as BaseCardsViewConfig,
	CardActionButton as BaseCardActionButton
} from '@/transformers/settings/schema';

/**
 * Estilos de tarjeta disponibles
 */
export type CardStyle = 'compact' | 'detailed' | 'minimal';

/**
 * Configuración de botones de acción hover con función
 */
export interface CardActionButton extends BaseCardActionButton {
	/** Función a ejecutar al hacer click */
	action: (entity: AnyEntityWithStats) => void;
}

/**
 * Configuración completa de CardsView con funciones
 */
export interface CardsViewConfig extends Omit<BaseCardsViewConfig, 'interactiveConfig'> {
	/** Configuración de modo interactivo */
	interactiveConfig: Omit<BaseCardsViewConfig['interactiveConfig'], 'actionButtons'> & {
		/** Botones de acción configurados */
		actionButtons: CardActionButton[];
	};
}

/**
 * Configuración por defecto para CardsView
 */
export const DEFAULT_CARDS_CONFIG: CardsViewConfig = {
	cardStyle: 'detailed',
	cardWidth: 280,
	minCardWidth: 200,
	maxCardWidth: 400,
	aspectRatio: 1.25, // 4:5 ratio
	gap: 16,
	padding: 24,
	metadataConfig: {
		showSize: true,
		showDate: true,
		showType: true,
		showDimensions: true,
		showDuration: true,
		showTags: true,
		showCollection: false,
		maxTags: 3,
	},
	interactiveConfig: {
		enabled: true,
		showActionButtons: true,
		actionButtons: [],
		showInfoOverlay: false,
		overlayPosition: 'bottom',
		showQuickPreview: false,
		hoverDelay: 300,
	},
	showShadows: true,
	roundedCorners: true,
	animationsEnabled: true,
	animationDuration: 300,
	allowMultiSelect: true,
	showSelectionIndicators: true,
};

/**
 * Presets predefinidos para diferentes usos
 */
export const CARDS_PRESETS: Record<string, Partial<CardsViewConfig>> = {
	compact: {
		cardStyle: 'compact',
		cardWidth: 200,
		minCardWidth: 150,
		maxCardWidth: 250,
		aspectRatio: 1.1,
		gap: 12,
		padding: 16,
		metadataConfig: {
			showSize: false,
			showDate: false,
			showType: true,
			showDimensions: false,
			showDuration: false,
			showTags: false,
			showCollection: false,
			maxTags: 0,
		},
		interactiveConfig: {
			enabled: false,
			showActionButtons: false,
			actionButtons: [],
			showInfoOverlay: false,
			overlayPosition: 'bottom',
			showQuickPreview: false,
			hoverDelay: 300,
		},
	},

	detailed: {
		cardStyle: 'detailed',
		cardWidth: 320,
		minCardWidth: 250,
		maxCardWidth: 400,
		aspectRatio: 1.4,
		gap: 20,
		padding: 30,
		metadataConfig: {
			showSize: true,
			showDate: true,
			showType: true,
			showDimensions: true,
			showDuration: true,
			showTags: true,
			showCollection: true,
			maxTags: 5,
		},
		interactiveConfig: {
			enabled: true,
			showActionButtons: true,
			actionButtons: [],
			showInfoOverlay: true,
			overlayPosition: 'bottom',
			showQuickPreview: true,
			hoverDelay: 200,
		},
	},

	minimal: {
		cardStyle: 'minimal',
		cardWidth: 180,
		minCardWidth: 120,
		maxCardWidth: 220,
		aspectRatio: 1.0,
		gap: 8,
		padding: 12,
		metadataConfig: {
			showSize: false,
			showDate: false,
			showType: false,
			showDimensions: false,
			showDuration: false,
			showTags: false,
			showCollection: false,
			maxTags: 0,
		},
		interactiveConfig: {
			enabled: false,
			showActionButtons: false,
			actionButtons: [],
			showInfoOverlay: false,
			overlayPosition: 'center',
			showQuickPreview: false,
			hoverDelay: 500,
		},
		showShadows: false,
		roundedCorners: false,
	},

	gallery: {
		cardStyle: 'detailed',
		cardWidth: 260,
		minCardWidth: 200,
		maxCardWidth: 300,
		aspectRatio: 1.3,
		gap: 18,
		padding: 25,
		metadataConfig: {
			showSize: false,
			showDate: false,
			showType: false,
			showDimensions: true,
			showDuration: true,
			showTags: true,
			showCollection: false,
			maxTags: 2,
		},
		interactiveConfig: {
			enabled: true,
			showActionButtons: true,
			actionButtons: [],
			showInfoOverlay: true,
			overlayPosition: 'center',
			showQuickPreview: true,
			hoverDelay: 150,
		},
	},
};

/**
 * Botones de acción predeterminados
 */
export const DEFAULT_ACTION_BUTTONS: CardActionButton[] = [
	{
		id: 'quick-view',
		icon: 'Eye',
		tooltip: 'Vista rápida',
		action: () => { },
		visible: true,
		position: 'top-right',
	},
	{
		id: 'favorite',
		icon: 'Heart',
		tooltip: 'Agregar a favoritos',
		action: () => { },
		visible: true,
		position: 'top-left',
	},
	{
		id: 'share',
		icon: 'Share2',
		tooltip: 'Compartir',
		action: () => { },
		visible: false,
		position: 'bottom-right',
	},
	{
		id: 'download',
		icon: 'Download',
		tooltip: 'Descargar',
		action: () => { },
		visible: false,
		position: 'bottom-left',
	},
];

/**
 * Helper para calcular layout dinámico
 */
export function calculateCardsLayout(
	config: CardsViewConfig,
	containerWidth: number,
	itemCount: number
) {
	const availableWidth = containerWidth - (config.padding * 2);

	// Calcular número óptimo de columnas
	let columns = Math.max(1, Math.floor((availableWidth + config.gap) / (config.minCardWidth + config.gap)));

	// Ajustar ancho de card basado en columnas
	let cardWidth = Math.floor((availableWidth - (config.gap * (columns - 1))) / columns);

	// Asegurar que el ancho esté dentro de los límites
	if (cardWidth > config.maxCardWidth) {
		cardWidth = config.maxCardWidth;
		columns = Math.floor((availableWidth + config.gap) / (cardWidth + config.gap));
	} else if (cardWidth < config.minCardWidth) {
		cardWidth = config.minCardWidth;
		columns = Math.max(1, Math.floor((availableWidth + config.gap) / (cardWidth + config.gap)));
	}

	// Calcular altura de card basada en aspect ratio
	const cardHeight = Math.round(cardWidth * config.aspectRatio);

	// Calcular número de filas
	const rows = Math.ceil(itemCount / columns);

	return {
		columns,
		rows,
		cardWidth,
		cardHeight,
		gap: config.gap,
		padding: config.padding,
		totalHeight: rows * (cardHeight + config.gap) - config.gap + (config.padding * 2),
	};
}
