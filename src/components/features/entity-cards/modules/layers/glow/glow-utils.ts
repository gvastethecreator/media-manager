/**
 * Utilidades para la capa de brillo
 */

/**
 * Genera los estilos CSS para el efecto de brillo
 * @param color - Color del brillo
 * @param intensity - Intensidad del brillo (0-1)
 * @param spread - Esparcimiento del brillo en píxeles
 * @returns Estilos CSS para aplicar el efecto de brillo
 */
export function generateGlowStyles(color: string, intensity = 0.5, spread = 100): Record<string, string> {
	// Normalizar valores
	const normalizedIntensity = Math.max(0, Math.min(1, intensity));
	const normalizedSpread = Math.max(10, spread);

	// Convertir el color a RGB si viene en formato hex
	let processedColor = color;
	if (color.startsWith('#')) {
		const r = Number.parseInt(color.slice(1, 3), 16);
		const g = Number.parseInt(color.slice(3, 5), 16);
		const b = Number.parseInt(color.slice(5, 7), 16);
		processedColor = `rgba(${r}, ${g}, ${b}, ${normalizedIntensity})`;
	}

	// Crear variaciones del color para el gradiente
	const colorBright = color.startsWith('rgba')
		? color.replace(/rgba\((\d+), (\d+), (\d+), [\d\.]+\)/, `rgba($1, $2, $3, ${normalizedIntensity})`)
		: processedColor;

	const colorMid = color.startsWith('rgba')
		? color.replace(/rgba\((\d+), (\d+), (\d+), [\d\.]+\)/, `rgba($1, $2, $3, ${normalizedIntensity * 0.6})`)
		: processedColor.replace(/, [\d\.]+\)/, `, ${normalizedIntensity * 0.6})`);

	const colorDim = color.startsWith('rgba')
		? color.replace(/rgba\((\d+), (\d+), (\d+), [\d\.]+\)/, `rgba($1, $2, $3, ${normalizedIntensity * 0.3})`)
		: processedColor.replace(/, [\d\.]+\)/, `, ${normalizedIntensity * 0.3})`);

	// Retornar propiedades CSS
	return {
		'--glow-color-bright': colorBright,
		'--glow-color-mid': colorMid,
		'--glow-color-dim': colorDim,
		'--glow-spread': `${normalizedSpread}px`,
	};
}

/**
 * Calcula la opacidad basada en la distancia desde el centro
 * Útil para efectos de brillo radial
 * @param distance - Distancia normalizada desde el centro (0-1)
 * @param maxOpacity - Opacidad máxima
 * @param falloff - Velocidad de caída (1-10)
 * @returns Valor de opacidad calculado
 */
export function calculateRadialOpacity(distance: number, maxOpacity = 1, falloff = 2): number {
	// Aplicar curva para que la caída sea más natural
	const falloffFactor = Math.min(10, Math.max(1, falloff));
	return maxOpacity * Math.max(0, 1 - Math.pow(distance, falloffFactor));
}

/**
 * Genera un color con ligera variación aleatoria
 * Útil para efectos de brillo más naturales
 * @param baseColor - Color base en formato hexadecimal
 * @param variance - Variación máxima para cada componente RGB (0-1)
 * @returns Color con variación aplicada
 */
export function generateVariantColor(baseColor: string, variance = 0.1): string {
	// Asegurarse de que el color base es un formato hex válido
	if (!baseColor.startsWith('#') || baseColor.length !== 7) {
		return baseColor;
	}

	// Extraer componentes RGB
	const r = Number.parseInt(baseColor.slice(1, 3), 16);
	const g = Number.parseInt(baseColor.slice(3, 5), 16);
	const b = Number.parseInt(baseColor.slice(5, 7), 16);

	// Aplicar variación aleatoria a cada componente
	const maxVariance = 255 * variance;
	const newR = Math.max(0, Math.min(255, r + (Math.random() * 2 - 1) * maxVariance));
	const newG = Math.max(0, Math.min(255, g + (Math.random() * 2 - 1) * maxVariance));
	const newB = Math.max(0, Math.min(255, b + (Math.random() * 2 - 1) * maxVariance));

	// Convertir de nuevo a hex
	const toHex = (c: number) => {
		const hex = Math.round(c).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	};

	return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
