/**
 * Utilidades para cálculo de estadísticas y completitud
 */

/**
 * Calcula el porcentaje de completitud de un objeto basado en campos requeridos
 * @param obj - El objeto a evaluar
 * @param requiredFields - Array de campos que se consideran requeridos
 * @returns Porcentaje de completitud (0-100)
 */
export function calculateCompleteness<T extends Record<string, any>>(obj: T, requiredFields: (keyof T)[]): number {
	if (!obj || requiredFields.length === 0) {
		return 0;
	}

	const completedFields = requiredFields.filter((field) => {
		const value = obj[field];
		// Considera completo si el valor existe y no es null, undefined, o string vacío
		return value !== null && value !== undefined && value !== '';
	});

	return Math.round((completedFields.length / requiredFields.length) * 100);
}

/**
 * Calcula estadísticas básicas de un array de números
 * @param values - Array de valores numéricos
 * @returns Objeto con estadísticas básicas
 */
export function calculateBasicStats(values: number[]) {
	if (values.length === 0) {
		return {
			min: 0,
			max: 0,
			avg: 0,
			sum: 0,
			count: 0,
		};
	}

	const sum = values.reduce((acc, val) => acc + val, 0);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const avg = sum / values.length;

	return {
		min,
		max,
		avg: Math.round(avg * 100) / 100, // Redondear a 2 decimales
		sum,
		count: values.length,
	};
}

/**
 * Calcula la diversidad de uso basada en diferentes categorías
 * @param counts - Objeto con conteos por categoría
 * @returns Puntuación de diversidad (0-100)
 */
export function calculateUsageDiversity(counts: Record<string, number>): number {
	const values = Object.values(counts).filter((count) => count > 0);

	if (values.length === 0) {
		return 0;
	}

	// Calcula el índice de Shannon para diversidad
	const total = values.reduce((sum, count) => sum + count, 0);
	const entropy = values.reduce((entropy, count) => {
		const probability = count / total;
		return entropy - probability * Math.log2(probability);
	}, 0);

	// Normaliza a escala 0-100
	const maxEntropy = Math.log2(values.length);
	return maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 100) : 0;
}

/**
 * Calcula la popularidad basada en uso y frecuencia
 * @param totalUses - Número total de usos
 * @param recentUses - Usos recientes (últimos 30 días)
 * @param maxUses - Máximo número de usos para normalización
 * @returns Puntuación de popularidad (0-100)
 */
export function calculatePopularity(totalUses: number, recentUses = 0, maxUses = 1000): number {
	// Peso para usos totales vs recientes
	const totalWeight = 0.7;
	const recentWeight = 0.3;

	// Normaliza los valores
	const normalizedTotal = Math.min(totalUses / maxUses, 1);
	const normalizedRecent = Math.min(recentUses / (maxUses * 0.1), 1); // Los usos recientes tienen un máximo menor

	const popularity = normalizedTotal * totalWeight + normalizedRecent * recentWeight;
	return Math.round(popularity * 100);
}

/**
 * Calcula un nivel de rareza basado en frecuencia de uso
 * @param usageCount - Número de veces que se ha usado
 * @param totalItems - Total de items en la categoría
 * @returns Nivel de rareza
 */
export function calculateRarityLevel(
	usageCount: number,
	totalItems: number
): 'common' | 'uncommon' | 'rare' | 'legendary' {
	if (totalItems === 0) return 'common';

	const usagePercentile = (usageCount / totalItems) * 100;

	if (usagePercentile >= 75) return 'legendary';
	if (usagePercentile >= 50) return 'rare';
	if (usagePercentile >= 25) return 'uncommon';
	return 'common';
}

/**
 * Calcula la eficiencia de almacenamiento
 * @param originalSize - Tamaño original en bytes
 * @param compressedSize - Tamaño comprimido en bytes
 * @returns Porcentaje de eficiencia (0-100)
 */
export function calculateStorageEfficiency(originalSize: number, compressedSize: number): number {
	if (originalSize === 0) return 0;
	const savings = (originalSize - compressedSize) / originalSize;
	return Math.round(Math.max(0, savings) * 100);
}

/**
 * Calcula la puntuación de calidad basada en múltiples factores
 * @param factors - Objeto con diferentes factores de calidad
 * @returns Puntuación de calidad (0-100)
 */
export function calculateQualityScore(factors: {
	completeness?: number;
	accuracy?: number;
	consistency?: number;
	relevance?: number;
}): number {
	const weights = {
		completeness: 0.3,
		accuracy: 0.3,
		consistency: 0.2,
		relevance: 0.2,
	};

	let totalScore = 0;
	let totalWeight = 0;

	for (const [factor, score] of Object.entries(factors)) {
		if (score !== undefined && factor in weights) {
			const weight = weights[factor as keyof typeof weights];
			totalScore += score * weight;
			totalWeight += weight;
		}
	}

	return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}
