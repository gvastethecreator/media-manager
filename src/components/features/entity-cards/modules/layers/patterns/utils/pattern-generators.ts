interface PatternGeneratorProps {
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	type: string;
	color: string;
	spacing: number;
	lineWidth: number;
}

/**
 * Genera un patrón de cuadrícula
 */
function generateGridPattern({ ctx, width, height, color, spacing, lineWidth }: PatternGeneratorProps) {
	ctx.strokeStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.beginPath();

	// Líneas verticales
	for (let x = 0; x <= width; x += spacing) {
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
	}

	// Líneas horizontales
	for (let y = 0; y <= height; y += spacing) {
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
	}

	ctx.stroke();
}

/**
 * Genera un patrón de puntos
 */
function generateDotsPattern({ ctx, width, height, color, spacing, lineWidth }: PatternGeneratorProps) {
	ctx.fillStyle = color;

	for (let x = spacing; x <= width; x += spacing) {
		for (let y = spacing; y <= height; y += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, lineWidth, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

/**
 * Genera un patrón de hexágonos
 */
function generateHexagonPattern({ ctx, width, height, color, spacing, lineWidth }: PatternGeneratorProps) {
	ctx.strokeStyle = color;
	ctx.lineWidth = lineWidth;

	const a = spacing / 2;
	const b = spacing * Math.sin(Math.PI / 3);
	const c = spacing * Math.cos(Math.PI / 3);

	for (let y = -b; y <= height + b; y += b) {
		const offset = (Math.floor(y / b) % 2) * c;
		for (let x = -c; x <= width + c; x += spacing) {
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const angle = (Math.PI / 3) * i;
				const px = x + offset + a * Math.cos(angle);
				const py = y + a * Math.sin(angle);
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.stroke();
		}
	}
}

/**
 * Genera un patrón de líneas
 */
function generateLinesPattern({ ctx, width, height, color, spacing, lineWidth }: PatternGeneratorProps) {
	ctx.strokeStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.beginPath();

	for (let x = 0; x <= width + height; x += spacing) {
		ctx.moveTo(x, 0);
		ctx.lineTo(x - height, height);
	}

	ctx.stroke();
}

/**
 * Genera el patrón según el tipo especificado
 */
export function generatePattern(props: PatternGeneratorProps) {
	switch (props.type) {
		case 'grid':
			generateGridPattern(props);
			break;
		case 'dots':
			generateDotsPattern(props);
			break;
		case 'hexagon':
			generateHexagonPattern(props);
			break;
		case 'lines':
			generateLinesPattern(props);
			break;
		default:
			generateGridPattern(props);
	}
}
