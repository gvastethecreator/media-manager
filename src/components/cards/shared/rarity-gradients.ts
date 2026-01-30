// Centralización de gradientes de rareza y helper.
// Extraído inicialmente de place-card para reutilización en otras cartas.

export interface RarityGradientOptions {
	level: number;
	primary: string;
	secondary?: string;
}

// Mapa de funciones generadoras de gradiente según nivel umbral.
// Nota: Conservamos los mismos patrones originales para no alterar UI.
const RARITY_GRADIENT_BUILDERS = {
	9: (primary: string) => `linear-gradient(45deg, transparent, ${primary}70, gold, ${primary}70, transparent)`,
	7: (primary: string) => `linear-gradient(45deg, transparent, ${primary}70, silver, ${primary}70, transparent)`,
	5: (primary: string, secondary: string) =>
		`linear-gradient(45deg, transparent, ${primary}70, ${secondary}70, transparent)`,
	0: (primary: string) => `linear-gradient(45deg, transparent, ${primary}40, transparent)`,
} as const;

/**
 * Devuelve el gradiente apropiado para el nivel de rareza.
 * Mantiene la lógica condicional secuencial para facilitar lectura.
 */
export function getRarityGradient({ level, primary, secondary }: RarityGradientOptions): string {
	if (level >= 9) {
		return RARITY_GRADIENT_BUILDERS[9](primary);
	}
	if (level >= 7) {
		return RARITY_GRADIENT_BUILDERS[7](primary);
	}
	if (level >= 5 && secondary) {
		return RARITY_GRADIENT_BUILDERS[5](primary, secondary);
	}
	return RARITY_GRADIENT_BUILDERS[0](primary);
}

export const rarityGradientBuilders = RARITY_GRADIENT_BUILDERS;
