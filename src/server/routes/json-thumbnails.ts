/**
 * @file Rutas para generación de thumbnails de archivos JSON
 * @module server/routes/json-thumbnails
 */

import { eq } from 'drizzle-orm';
import express from 'express';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle/index.js';
import { jsonFiles } from '@/lib/drizzle/schema/index.js';
import { serverLogger } from '@/lib/logger/server-logger';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { authorizeMediaAssetParam } from '@/server/security/authorized-root-request';

const router = express.Router();

/**
 * 📝 Interfaz para opciones de generación de preview JSON
 */
interface JsonPreviewOptions {
	height?: number;
	maxLines?: number;
	showLineNumbers?: boolean;
	theme?: 'light' | 'dark';
	width?: number;
}

/**
 * 🎨 Configuración de temas para syntax highlighting
 */
const THEMES = {
	light: {
		background: 'var(--background)',
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
		string: 'var(--dt-success-500)',
		number: 'var(--dt-danger-500)',
		boolean: 'var(--dt-warning-500)',
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
		svgContent += `<text x="${padding + lineNumberWidth}" y="${padding + fontSize * 2}" class="json-text" fill="var(--dt-danger-500)">Parse Error</text>`;
	}

	svgContent += '</svg>';
	return svgContent;
}

/**
 * GET /json/:id/preview - Generar preview de archivo JSON
 */
router.get(
	'/:id/preview',
	authorizeMediaAssetParam({ assetType: 'json', permissions: ['read', 'index'] }),
	effectHandler(
		(req) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options: JsonPreviewOptions = {
						maxLines: Math.min(Number.parseInt(req.query.maxLines as string, 10) || 20, 200),
						width: Math.min(Number.parseInt(req.query.width as string, 10) || 300, 2000),
						height: Math.min(Number.parseInt(req.query.height as string, 10) || 400, 2000),
						theme: (req.query.theme as 'light' | 'dark') || 'light',
						showLineNumbers: req.query.showLineNumbers === 'true',
					};

					const jsonRecords = await db
						.select({ metadata: jsonFiles.metadata })
						.from(jsonFiles)
						.where(eq(jsonFiles.id, id));

					if (jsonRecords.length === 0) {
						throw Object.assign(new Error('JSON file not found'), { _tag: 'FileNotFound' });
					}

					const jsonFile = jsonRecords[0];
					let metadata: any = null;

					if (jsonFile.metadata) {
						try {
							metadata = JSON.parse(jsonFile.metadata);
						} catch (e) {
							serverLogger.warn(`Error parsing metadata for JSON file ${id}:`, e);
						}
					}

					if (metadata?.thumbnail) {
						return { svg: metadata.thumbnail, status: 200 };
					}

					const themeColors = options.theme === 'dark' ? THEMES.dark : THEMES.light;
					const svgWidth = options.width ?? 300;
					const svgHeight = options.height ?? 400;
					const errorSVG = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${themeColors.background}"/>
  <g transform="translate(${svgWidth / 2},${svgHeight / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${themeColors.text}">
      📋 JSON File
    </text>
  </g>
</svg>`;
					return { svg: errorSVG, status: 404 };
				},
				catch: (error) => new Error(String(error)),
			}),
		{
			onSuccess: (data, res) => {
				res.setHeader('Content-Type', 'image/svg+xml');
				res.setHeader('Cache-Control', data.status === 200 ? 'public, max-age=3600' : 'public, max-age=60');
				res.status(data.status).send(data.svg);
			},
			onError: (_error, res) => {
				serverLogger.error('Error generando preview JSON:', _error);
				const svgWidth = 300;
				const svgHeight = 400;
				const themeColors = THEMES.light;
				const errorSVG = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${themeColors.background}"/>
  <g transform="translate(${svgWidth / 2},${svgHeight / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${themeColors.text}">
      ⚠ Error generating JSON preview
    </text>
  </g>
</svg>`;
				res.setHeader('Content-Type', 'image/svg+xml');
				res.setHeader('Cache-Control', 'public, max-age=60');
				res.status(500).send(errorSVG);
			},
		}
	)
);

export default router;
