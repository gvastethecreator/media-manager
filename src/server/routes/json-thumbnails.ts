/**
 * @file Rutas para generación de thumbnails de archivos JSON
 * @module server/routes/json-thumbnails
 */

import express from 'express';

const router = express.Router();

/**
 * 📝 Interfaz para opciones de generación de preview JSON
 */
interface JsonPreviewOptions {
	maxLines?: number;
	width?: number;
	height?: number;
	theme?: 'light' | 'dark';
	showLineNumbers?: boolean;
}

/**
 * 🎨 Configuración de temas para syntax highlighting
 */
const THEMES = {
	light: {
		background: '#ffffff',
		text: '#1f2937',
		keyword: '#7c3aed',
		string: '#059669',
		number: '#dc2626',
		boolean: '#ea580c',
		null: '#6b7280',
		lineNumber: '#9ca3af',
		bracket: '#374151',
	},
	dark: {
		background: '#111827',
		text: '#f9fafb',
		keyword: '#a855f7',
		string: '#10b981',
		number: '#ef4444',
		boolean: '#f59e0b',
		null: '#9ca3af',
		lineNumber: '#6b7280',
		bracket: '#d1d5db',
	},
};

/**
 * 🔍 Función para aplicar syntax highlighting básico al JSON
 */
function highlightJson(
	jsonString: string,
	theme: keyof typeof THEMES
): Array<{ text: string; color: string; type: string }> {
	const themeColors = THEMES[theme];
	const tokens: Array<{ text: string; color: string; type: string }> = [];

	// Regex para identificar diferentes tipos de tokens
	const tokenPattern = /"([^"\\]|\\.)*"|(-?\d+\.?\d*)|(\btrue\b|\bfalse\b)|\bnull\b|[{}[\]:,]/g;

	let lastIndex = 0;
	let match: RegExpExecArray | null;

	// biome-ignore lint: necessary for regex matching
	while ((match = tokenPattern.exec(jsonString)) !== null) {
		// Agregar texto antes del match (whitespace, etc.)
		if (match.index > lastIndex) {
			const beforeText = jsonString.slice(lastIndex, match.index);
			tokens.push({ text: beforeText, color: themeColors.text, type: 'text' });
		}

		const token = match[0];
		let color = themeColors.text;
		let type = 'text';

		if (token.startsWith('"')) {
			// String
			color = themeColors.string;
			type = 'string';
		} else if (/^-?\d+\.?\d*$/.test(token)) {
			// Number
			color = themeColors.number;
			type = 'number';
		} else if (token === 'true' || token === 'false') {
			// Boolean
			color = themeColors.boolean;
			type = 'boolean';
		} else if (token === 'null') {
			// Null
			color = themeColors.null;
			type = 'null';
		} else if (/[{}[\]:,]/.test(token)) {
			// Brackets and punctuation
			color = themeColors.bracket;
			type = 'bracket';
		}

		tokens.push({ text: token, color, type });
		lastIndex = tokenPattern.lastIndex;
	}

	// Agregar texto restante
	if (lastIndex < jsonString.length) {
		const remainingText = jsonString.slice(lastIndex);
		tokens.push({ text: remainingText, color: themeColors.text, type: 'text' });
	}

	return tokens;
}

/**
 * 🎨 Genera SVG con preview del JSON
 */
function generateJsonPreviewSVG(jsonContent: string, options: JsonPreviewOptions): string {
	const { width = 300, height = 400, theme = 'light', showLineNumbers = true, maxLines = 20 } = options;

	const themeColors = THEMES[theme];
	const fontSize = 10;
	const lineHeight = 12;
	const padding = 10;
	const lineNumberWidth = showLineNumbers ? 30 : 0;

	let svgContent = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${themeColors.background}"/>
  <style>
    .line-number { font-family: 'Courier New', monospace; font-size: ${fontSize}px; fill: ${themeColors.lineNumber}; }
    .json-text { font-family: 'Courier New', monospace; font-size: ${fontSize}px; }
  </style>
`;

	try {
		// Formatear y procesar JSON
		const formatted = JSON.stringify(JSON.parse(jsonContent), null, 2);
		const lines = formatted.split('\n').slice(0, maxLines);

		let yPosition = padding + fontSize;

		for (const [index, line] of lines.entries()) {
			// Límite de altura
			if (yPosition > height - padding) break;

			// Line number
			if (showLineNumbers) {
				svgContent += `<text x="${padding}" y="${yPosition}" class="line-number">${(index + 1).toString().padStart(2, ' ')}</text>`;
			}

			// Highlight syntax
			const tokens = highlightJson(line, theme);
			let xPosition = padding + lineNumberWidth;

			for (const token of tokens) {
				const escapedText = token.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

				// Limitar ancho del texto - truncar si es muy largo
				const estimatedWidth = escapedText.length * (fontSize * 0.6);
				const maxTextWidth = width - xPosition - padding;

				let displayText = escapedText;
				if (estimatedWidth > maxTextWidth) {
					const maxChars = Math.floor(maxTextWidth / (fontSize * 0.6)) - 3;
					displayText = `${escapedText.slice(0, Math.max(0, maxChars))}...`;
				}

				svgContent += `<text x="${xPosition}" y="${yPosition}" class="json-text" fill="${token.color}">${displayText}</text>`;
				xPosition += displayText.length * (fontSize * 0.6);

				// Límite horizontal
				if (xPosition > width - padding) break;
			}

			yPosition += lineHeight;
		}

		// Indicador de más líneas
		if (formatted.split('\n').length > maxLines) {
			svgContent += `<text x="${padding + lineNumberWidth}" y="${yPosition}" class="json-text" fill="${themeColors.text}">...</text>`;
		}
	} catch (parseError) {
		// Si el JSON es inválido, mostrar error
		svgContent += `<text x="${padding + lineNumberWidth}" y="${padding + fontSize}" class="json-text" fill="${themeColors.text}">Invalid JSON</text>`;
		svgContent += `<text x="${padding + lineNumberWidth}" y="${padding + fontSize * 2}" class="json-text" fill="#ef4444">Parse Error</text>`;
	}

	svgContent += '</svg>';
	return svgContent;
}

/**
 * GET /json/:id/preview - Generar preview de archivo JSON
 */
router.get('/:id/preview', async (req, res) => {
	try {
		const { id } = req.params;
		const options: JsonPreviewOptions = {
			maxLines: Number.parseInt(req.query.maxLines as string, 10) || 20,
			width: Number.parseInt(req.query.width as string, 10) || 300,
			height: Number.parseInt(req.query.height as string, 10) || 400,
			theme: (req.query.theme as 'light' | 'dark') || 'light',
			showLineNumbers: req.query.showLineNumbers === 'true',
		};

		// TODO: Obtener el archivo JSON desde la base de datos usando el id
		// Por ahora, usamos un ejemplo
		const jsonContent = `{
  "name": "example",
  "version": "1.0.0",
  "description": "Sample JSON file",
  "data": {
    "items": [1, 2, 3],
    "enabled": true,
    "config": null
  }
}`;

		const previewSVG = generateJsonPreviewSVG(jsonContent, options);

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=3600');
		res.send(previewSVG);
	} catch (error) {
		console.error('Error generando preview JSON:', error);
		res.status(500).json({ error: 'Error generating JSON preview' });
	}
});

export default router;
