/**
 * Estilos predefinidos para el efecto holográfico
 * Estos estilos permiten diferentes apariencias visuales para el efecto holográfico
 * basado en diferentes patrones y técnicas de gradiente
 */
export const holographicStyles = {
	// Patrón de arcoíris con gradiente lineal
	rainbow: {
		background:
			'linear-gradient({{positionX}}deg, rgba(255, 0, 0, 0.2), rgba(255, 165, 0, 0.2), rgba(255, 255, 0, 0.2), rgba(0, 128, 0, 0.2), rgba(0, 0, 255, 0.2), rgba(75, 0, 130, 0.2), rgba(238, 130, 238, 0.2))',
		backgroundSize: '200% 200%',
	},

	// Gradiente lineal entre dos colores
	linear: {
		background: 'linear-gradient({{positionX}}deg, {{primaryColor}}, {{secondaryColor}})',
		backgroundSize: '200% 200%',
	},

	// Gradiente radial que sigue la posición del ratón
	radial: {
		background: 'radial-gradient(circle at {{positionX}}% {{positionY}}%, {{primaryColor}}, {{secondaryColor}})',
		backgroundSize: '200% 200%',
	},

	// Gradiente diagonal fijo
	diagonal: {
		background: 'linear-gradient(45deg, {{primaryColor}}, {{secondaryColor}})',
		backgroundSize: '200% 200%',
	},

	// Patrón de rejilla
	grid: {
		background:
			'repeating-linear-gradient({{positionX}}deg, {{primaryColor}}, {{primaryColor}} 10px, {{secondaryColor}} 10px, {{secondaryColor}} 20px)',
		backgroundSize: '100% 100%',
	},

	// Patrón de ondas
	waves: {
		background:
			'repeating-radial-gradient(circle at {{positionX}}% {{positionY}}%, {{primaryColor}}, {{primaryColor}} 10px, {{secondaryColor}} 10px, {{secondaryColor}} 20px)',
		backgroundSize: '200% 200%',
	},

	// Patrón de diamante
	diamond: {
		background:
			'conic-gradient(from {{positionX}}deg at 50% 50%, {{primaryColor}}, {{secondaryColor}}, {{primaryColor}})',
		backgroundSize: '200% 200%',
	},
};
