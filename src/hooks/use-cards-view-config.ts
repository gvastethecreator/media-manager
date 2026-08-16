/**
 * @file Hook for cards view configuration
 * @module hooks/use-cards-view-config
 */

import { useMemo } from 'react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { useViewConfiguration } from './use-view-configuration';

export interface CardsLayout {
	cardHeight: number;
	cardWidth: number;
	columns: number;
	gap: number;
	padding: number;
	rows: number;
}

export interface InteractiveConfig {
	actionButtons: string[];
	enabled: boolean;
	hoverDelay: number;
	overlayPosition: 'top' | 'bottom' | 'center' | 'auto';
	showActionButtons: boolean;
	showInfoOverlay: boolean;
}

export interface MetadataConfig {
	maxDescriptionLength: number;
	showDate: boolean;
	showDescription: boolean;
	showSize: boolean;
	showTags: boolean;
	showType: boolean;
}

export interface CardsViewConfig {
	adaptiveColumns: boolean;
	animationDuration: number;
	animationsEnabled: boolean;
	cardAspectRatio: number;
	cardStyle: 'default' | 'compact' | 'detailed';
	interactiveConfig: InteractiveConfig;
	maxCardWidth: number;
	metadataConfig: MetadataConfig;
	minCardWidth: number;
	responsiveBreakpoints: {
		sm: number;
		md: number;
		lg: number;
		xl: number;
	};
	roundedCorners: boolean;
	showSelectionIndicators: boolean;
	showShadows: boolean;
}

const DEFAULT_CONFIG: CardsViewConfig = {
	cardStyle: 'default',
	cardAspectRatio: 1.2,
	minCardWidth: 160,
	maxCardWidth: 280,
	adaptiveColumns: true,
	showShadows: true,
	roundedCorners: true,
	showSelectionIndicators: true,
	animationsEnabled: true,
	animationDuration: 200,
	interactiveConfig: {
		enabled: true,
		hoverDelay: 300,
		showInfoOverlay: true,
		showActionButtons: true,
		overlayPosition: 'bottom',
		actionButtons: ['preview', 'download', 'share', 'delete'],
	},
	metadataConfig: {
		showSize: true,
		showDate: true,
		showType: true,
		showTags: false,
		showDescription: false,
		maxDescriptionLength: 100,
	},
	responsiveBreakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
};

export function useCardsViewConfig() {
	const { currentConfig } = useViewConfiguration('cards');
	const preferredItemSize = useViewOptionsStore((s) => s.itemSize);

	// Merge with current configuration if available
	const config = useMemo(() => {
		const cardsConfig = currentConfig?.specific?.type === 'cards' ? currentConfig.specific.config : undefined;
		return {
			...DEFAULT_CONFIG,
			...cardsConfig,
			interactiveConfig: {
				...DEFAULT_CONFIG.interactiveConfig,
				...cardsConfig?.interactiveConfig,
			},
			metadataConfig: {
				...DEFAULT_CONFIG.metadataConfig,
				...cardsConfig?.metadataConfig,
			},
		};
	}, [currentConfig]);

	const calculateLayout = useMemo(() => {
		return (containerWidth: number, itemCount: number): CardsLayout => {
			if (!containerWidth || containerWidth <= 0) {
				return {
					columns: 1,
					rows: itemCount,
					cardWidth: config.minCardWidth,
					cardHeight: config.minCardWidth * config.cardAspectRatio,
					gap: 16,
					padding: 16,
				};
			}

			const gap = 16;
			const padding = 16;
			const availableWidth = containerWidth - padding * 2;

			let cardWidth = config.minCardWidth;
			let columns = 1;

			// Tamaño objetivo desde la barra (clamp entre min/max)
			const targetWidth = Math.max(config.minCardWidth, Math.min(preferredItemSize, config.maxCardWidth));

			if (config.adaptiveColumns) {
				// Calculate optimal number of columns based on container width
				// Estimar columnas a partir del tamaño objetivo del usuario
				columns = Math.max(1, Math.floor((availableWidth + gap) / (targetWidth + gap)));
				columns = Math.min(columns, 6);

				// Calcular ancho real con ese número de columnas
				cardWidth = (availableWidth - gap * (columns - 1)) / columns;
				cardWidth = Math.max(config.minCardWidth, Math.min(cardWidth, config.maxCardWidth));
			} else {
				// Fixed card width, calculate columns
				cardWidth = targetWidth;
				columns = Math.floor(availableWidth / (cardWidth + gap));
				columns = Math.max(1, columns);
			}

			const cardHeight = cardWidth * config.cardAspectRatio;
			const rows = Math.ceil(itemCount / columns);

			return {
				columns,
				rows,
				cardWidth,
				cardHeight,
				gap,
				padding,
			};
		};
	}, [config, preferredItemSize]);

	const getCardDimensions = useMemo(() => {
		return (layout: CardsLayout) => {
			return {
				width: layout.cardWidth,
				height: layout.cardHeight,
			};
		};
	}, []);

	const shouldShowAnimation = useMemo(() => {
		return (itemIndex: number): boolean => {
			return config.animationsEnabled && itemIndex < 100; // Limit animations to first 100 items
		};
	}, [config.animationsEnabled]);

	const getAnimationDelay = useMemo(() => {
		return (itemIndex: number): number => {
			return itemIndex * 0.02; // 20ms delay between items
		};
	}, []);

	const getAnimationDuration = useMemo(() => {
		return (): number => {
			return config.animationDuration / 1000; // Convert to seconds for motion
		};
	}, [config.animationDuration]);

	return {
		config,
		calculateLayout,
		getCardDimensions,
		shouldShowAnimation,
		getAnimationDelay,
		getAnimationDuration,
	};
}
