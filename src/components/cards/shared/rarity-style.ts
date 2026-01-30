/*
 * Módulo central de estilos y efectos de rareza / TCG.
 *
 * Objetivos:
 *  - Unificar thresholds y lógica de decisión (glow, holograma, textura animada).
 *  - Centralizar utilidades de color (darkenHex) evitando duplicación.
 *  - Proveer funciones declarativas y con tipado estricto.
 *  - Servir de base para futuras capas (CardEffectsLayer) y tests unitarios.
 */

import type React from 'react';

export type RarityTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface RarityVisualConfig {
	/** Nivel numérico continuo (0..N) */
	level: number;
	/** Tier nominal derivado del nivel */
	tier: RarityTier;
	/** Número de puntos/dots a mostrar (visual) */
	dots: number;
	/** Efectos */
	enableGlow: boolean;
	enableHolo: boolean;
	enableAnimatedTexture: boolean;
	thresholds: {
		glow: boolean;
		holo: boolean;
		texture: boolean;
	};
}

const RARITY_ORDER: RarityTier[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

// Umbrales centralizados: si cambian se propaga automáticamente
export const RARITY_THRESHOLDS = {
	glow: 3,
	holo: 5,
	advanced: 7,
	mythic: 9,
} as const;

export interface ComputeRarityOptions {
	level?: number; // Tiene prioridad
	tier?: RarityTier | string | null;
	overrideDots?: number;
}

export function mapLevelToTier(level: number): RarityTier {
	if (level >= RARITY_THRESHOLDS.mythic) {
		return 'mythic';
	}
	if (level >= RARITY_THRESHOLDS.advanced) {
		return 'legendary';
	}
	if (level >= RARITY_THRESHOLDS.holo) {
		return 'epic';
	}
	if (level >= RARITY_THRESHOLDS.glow) {
		return 'rare';
	}
	return 'common';
}

export function mapTierToBaseLevel(tier: RarityTier): number {
	switch (tier) {
		case 'mythic':
			return RARITY_THRESHOLDS.mythic;
		case 'legendary':
			return RARITY_THRESHOLDS.advanced;
		case 'epic':
			return RARITY_THRESHOLDS.holo;
		case 'rare':
			return RARITY_THRESHOLDS.glow;
		default: {
			return 0;
		}
	}
}

export function normalizeTier(tier: string | null | undefined): RarityTier {
	const lower = (tier || '').toLowerCase();
	if ((RARITY_ORDER as string[]).includes(lower)) {
		return lower as RarityTier;
	}
	return 'common';
}

/** Oscurece un color HEX.
 *  factor 1 => igual; <1 más oscuro. */
export function darkenHex(hex: string, factor = 0.7): string {
	const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
	if (normalized.length !== 6) {
		return hex;
	}
	const r = Math.max(0, Math.min(255, Math.round(Number.parseInt(normalized.slice(0, 2), 16) * factor)));
	const g = Math.max(0, Math.min(255, Math.round(Number.parseInt(normalized.slice(2, 4), 16) * factor)));
	const b = Math.max(0, Math.min(255, Math.round(Number.parseInt(normalized.slice(4, 6), 16) * factor)));
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function computeRarityVisualConfig(options: ComputeRarityOptions = {}): RarityVisualConfig {
	const { level, tier, overrideDots } = options;
	let derivedLevel: number;
	if (typeof level === 'number') {
		derivedLevel = level;
	} else if (typeof tier === 'string') {
		derivedLevel = mapTierToBaseLevel(normalizeTier(tier));
	} else {
		derivedLevel = 0;
	}
	const tierName = mapLevelToTier(derivedLevel);
	const thresholds = {
		glow: derivedLevel >= RARITY_THRESHOLDS.glow,
		holo: derivedLevel >= RARITY_THRESHOLDS.holo,
		texture: derivedLevel >= RARITY_THRESHOLDS.advanced,
	};
	return {
		level: derivedLevel,
		tier: tierName,
		dots: overrideDots ?? Math.min(derivedLevel, 5),
		enableGlow: thresholds.glow,
		enableHolo: thresholds.holo,
		enableAnimatedTexture: thresholds.texture,
		thresholds,
	};
}

export function buildHolographicStyle(
	primaryColor: string,
	config: RarityVisualConfig,
	active: boolean
): React.CSSProperties {
	if (!(active && config.enableHolo)) {
		return { transform: 'translateZ(0)' };
	}
	return {
		background: `linear-gradient(125deg, ${primaryColor}22 0%, ${primaryColor}00 45%, ${primaryColor}33 55%, ${primaryColor}05 100%)`,
		boxShadow: `${primaryColor}40 0 0 8px`,
		filter: config.enableAnimatedTexture ? 'saturate(1.1) brightness(1.05)' : undefined,
	};
}

export function rarityAccessibilityLabel(base: string, config: RarityVisualConfig): string {
	if (!config.enableHolo) {
		return base;
	}
	return `${base} con efectos especiales ${config.tier}`;
}

// Futuras extensiones:
// - cache/memo de gradientes
// - tema accesible (reducir animaciones)
// - extracción de CardEffectsLayer
