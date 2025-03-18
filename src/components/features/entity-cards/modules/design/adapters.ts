'use client';

import type { CardOptions } from '../../types/card-settings-types';
import { DEFAULT_DESIGN_SYSTEM } from './design-module';
import type { DesignSystem } from './types';

/**
 * 🎨 Adaptador de cardOptions a DesignSystem
 */
export function adaptCardOptionsToDesignSystem(cardOptions?: Partial<CardOptions>): Partial<DesignSystem> {
	if (!cardOptions) return {};

	const designSystem: Partial<DesignSystem> = {};

	// Convertir propiedades básicas
	if (cardOptions.designSystem) {
		// General
		if (cardOptions.designSystem.cornerRadius !== undefined) {
			designSystem.borderRadius = cardOptions.designSystem.cornerRadius;
			designSystem.cornerRadius = cardOptions.designSystem.cornerRadius;
		}

		if (cardOptions.designSystem.aspectRatio) {
			designSystem.aspectRatio = cardOptions.designSystem.aspectRatio;
		}

		if (cardOptions.designSystem.preset) {
			designSystem.preset = cardOptions.designSystem.preset;
		}

		if (cardOptions.designSystem.variant) {
			designSystem.variant = cardOptions.designSystem.variant;
		}

		if (cardOptions.designSystem.cornerStyle) {
			designSystem.cornerStyle = cardOptions.designSystem.cornerStyle;
		}

		// Sombras y elevación
		if (cardOptions.designSystem.elevation !== undefined) {
			designSystem.elevation = cardOptions.designSystem.elevation;
		}

		if (cardOptions.designSystem.shadowStyle) {
			designSystem.shadowStyle = cardOptions.designSystem.shadowStyle;
		}
	}

	// Convertir propiedades de color
	if (cardOptions.primaryColor) {
		designSystem.accentColor = cardOptions.primaryColor;
	}

	if (cardOptions.backgroundOptions?.color) {
		designSystem.backgroundColor = cardOptions.backgroundOptions.color;
	}

	if (cardOptions.backgroundOptions?.opacity !== undefined) {
		designSystem.backgroundOpacity = cardOptions.backgroundOptions.opacity;
	}

	// Convertir propiedades de borde
	if (cardOptions.borderOptions) {
		if (cardOptions.borderOptions.width !== undefined) {
			designSystem.borderWidth = cardOptions.borderOptions.width;
		}

		if (cardOptions.borderOptions.style) {
			designSystem.borderStyle = cardOptions.borderOptions.style;
		}

		if (cardOptions.borderOptions.color) {
			designSystem.borderColor = cardOptions.borderOptions.color;
		}

		if (cardOptions.borderOptions.radius !== undefined) {
			designSystem.borderRadius = cardOptions.borderOptions.radius;
		}
	}

	// Convertir propiedades de cristal/efecto de vidrio
	if (cardOptions.glassEffect?.enabled) {
		designSystem.glassEffect = true;
		designSystem.backdropFilter = 'blur';

		if (cardOptions.glassEffect.blurAmount !== undefined) {
			designSystem.backdropBlurAmount = cardOptions.glassEffect.blurAmount;
		}
	}

	return designSystem;
}

/**
 * 🎨 Adaptador de DesignSystem a cardOptions
 */
export function adaptDesignSystemToCardOptions(designSystem?: DesignSystem): Partial<CardOptions> {
	if (!designSystem) return {};

	const cardOptions: Partial<CardOptions> = {
		designSystem: {
			preset: designSystem.preset || DEFAULT_DESIGN_SYSTEM.preset,
			variant: designSystem.variant || DEFAULT_DESIGN_SYSTEM.variant,
			aspectRatio: designSystem.aspectRatio || DEFAULT_DESIGN_SYSTEM.aspectRatio,
			cornerStyle: designSystem.cornerStyle || DEFAULT_DESIGN_SYSTEM.cornerStyle,
			cornerRadius: designSystem.cornerRadius || designSystem.borderRadius || DEFAULT_DESIGN_SYSTEM.borderRadius,
			elevation: designSystem.elevation || DEFAULT_DESIGN_SYSTEM.elevation,
			shadowStyle: designSystem.shadowStyle || DEFAULT_DESIGN_SYSTEM.shadowStyle,
		},
		borderOptions: {
			width: designSystem.borderWidth || DEFAULT_DESIGN_SYSTEM.borderWidth,
			style: designSystem.borderStyle || DEFAULT_DESIGN_SYSTEM.borderStyle,
			color: designSystem.borderColor || DEFAULT_DESIGN_SYSTEM.borderColor,
			radius: designSystem.borderRadius || DEFAULT_DESIGN_SYSTEM.borderRadius,
		},
		backgroundOptions: {
			color: designSystem.backgroundColor || DEFAULT_DESIGN_SYSTEM.backgroundColor,
			opacity: designSystem.backgroundOpacity || DEFAULT_DESIGN_SYSTEM.backgroundOpacity,
		},
	};

	// Agregar efecto de vidrio si está activo
	if (designSystem.glassEffect || designSystem.backdropFilter !== 'none') {
		cardOptions.glassEffect = {
			enabled: true,
			blurAmount: designSystem.backdropBlurAmount || DEFAULT_DESIGN_SYSTEM.backdropBlurAmount,
		};
	}

	// Agregar color principal si está definido
	if (designSystem.accentColor) {
		cardOptions.primaryColor = designSystem.accentColor;
	}

	return cardOptions;
}

/**
 * 🎨 Función para convertir un diseño legacy al nuevo formato DesignSystem
 */
export function legacyToDesignSystem(legacyOptions: Partial<CardOptions>): Partial<DesignSystem> {
	const designSystem: Partial<DesignSystem> = {};

	if (legacyOptions.designSystem) {
		// Convertir propiedades legacy directamente
		Object.assign(designSystem, legacyOptions.designSystem);
	}

	// Agregar compatibilidad con otras propiedades legacy
	if (legacyOptions.primaryColor) {
		designSystem.accentColor = legacyOptions.primaryColor;
	}

	return designSystem;
}
