import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptBase, PromptExtended } from '@/types/entities/prompt/types';
import { preparePromptForDisplay, preparePromptForSaving } from './helpers';

const exportLogger = serverLogger.withContext('PromptExport');

/**
 * Formatos de exportación de prompts soportados
 */
export enum PromptExportFormat {
	JSON = 'json',
	MARKDOWN = 'markdown',
	TEXT = 'text',
	CSV = 'csv',
	HTML = 'html',
}

/**
 * Configuración de exportación de prompts
 */
export interface PromptExportConfig {
	/**
	 * Formato de exportación
	 */
	format: PromptExportFormat;

	/**
	 * Si se deben incluir metadatos (solo aplicable a algunos formatos)
	 */
	includeMetadata?: boolean;

	/**
	 * Nombre del archivo de exportación
	 */
	fileName?: string;

	/**
	 * Opciones específicas por formato
	 */
	formatOptions?: Record<string, any>;
}

/**
 * Resultado de la operación de exportación
 */
export interface PromptExportResult {
	/**
	 * Contenido exportado
	 */
	content: string;

	/**
	 * Tipo MIME para descarga
	 */
	mimeType: string;

	/**
	 * Nombre de archivo sugerido para descarga
	 */
	fileName: string;

	/**
	 * Formato usado para la exportación
	 */
	format: PromptExportFormat;
}

/**
 * Exporta un prompt a formato JSON
 * @param prompt Prompt a exportar
 * @param includeMetadata Si se incluyen metadatos adicionales
 * @returns Prompt en formato JSON
 */
// Cambios: title -> name, model -> purpose (según tipos canónicos)
function exportPromptToJSON(prompt: PromptBase | PromptExtended, includeMetadata = true): string {
	try {
		const displayPrompt = 'parsedTags' in prompt ? prompt : preparePromptForDisplay(prompt);
		if (!includeMetadata) {
			const { id, name, content, category, model, parameters } = displayPrompt;
			return JSON.stringify({ id, name, content, category, model, parameters }, null, 2);
		}
		return JSON.stringify(displayPrompt, null, 2);
	} catch (error) {
		exportLogger.error('❌ Error al exportar prompt a JSON:', error);
		return JSON.stringify({ error: 'Error al exportar prompt' });
	}
}

/**
 * Exporta un prompt a formato Markdown
 * @param prompt Prompt a exportar
 * @param includeMetadata Si se incluyen metadatos adicionales
 * @returns Prompt en formato Markdown
 */
function exportPromptToMarkdown(prompt: PromptBase | PromptExtended, includeMetadata = true): string {
	try {
		const displayPrompt = 'parsedTags' in prompt ? prompt : preparePromptForDisplay(prompt);
		let md = `# ${displayPrompt.name}\n\n`;
		if (includeMetadata) {
			md += `**Categoría:** ${displayPrompt.category}\n`;
			md += `**Modelo:** ${displayPrompt.model}\n`;

			// Añadir tags si existen
			const tags: string[] = displayPrompt.tags || [];
			if (tags.length > 0) {
				md += `**Tags:** ${tags.map((tag: string) => `\`${tag}\``).join(', ')}\n`;
			}

			// Añadir información de fecha
			const createdAt =
				displayPrompt.createdAt instanceof Date
					? displayPrompt.createdAt.toISOString().split('T')[0]
					: String(displayPrompt.createdAt);

			md += `**Creado:** ${createdAt}\n`;
			md += '\n---\n\n';
		}

		// Añadir contenido
		md += `${displayPrompt.content}\n\n`;

		// Añadir parámetros si existen y se solicitan metadatos
		if (includeMetadata) {
			const parameters = displayPrompt.parsedParameters || {};
			if (Object.keys(parameters).length > 0) {
				md += '## Parámetros\n\n';
				for (const [key, value] of Object.entries(parameters)) {
					md += `- **${key}:** ${JSON.stringify(value)}\n`;
				}
			}
		}

		return md;
	} catch (error) {
		exportLogger.error('❌ Error al exportar prompt a Markdown:', error);
		return `# Error al exportar ${prompt.name}`;
	}
}

/**
 * Exporta un prompt a formato de texto plano
 * @param prompt Prompt a exportar
 * @param includeMetadata Si se incluyen metadatos adicionales
 * @returns Prompt en formato texto
 */
function exportPromptToText(prompt: PromptBase | PromptExtended, includeMetadata = true): string {
	try {
		const displayPrompt = 'parsedTags' in prompt ? prompt : preparePromptForDisplay(prompt);
		let text = `${displayPrompt.name}\n\n`;
		if (includeMetadata) {
			text += `Categoría: ${displayPrompt.category}
`;
			text += `Modelo: ${displayPrompt.model}
`;

			// Añadir tags si existen
			const tags = displayPrompt.tags || [];
			if (tags.length > 0) {
				text += `Tags: ${tags.join(', ')}
`;
			}

			text += '\n-----------------\n\n';
		}
		text += `${displayPrompt.content}\n`;
		return text;
	} catch (error) {
		exportLogger.error('❌ Error al exportar prompt a texto:', error);
		return `Error al exportar ${prompt.name}`;
	}
}

/**
 * Exporta un prompt a formato HTML
 * @param prompt Prompt a exportar
 * @param includeMetadata Si se incluyen metadatos adicionales
 * @returns Prompt en formato HTML
 */
function exportPromptToHTML(prompt: PromptBase | PromptExtended, includeMetadata = true): string {
	try {
		const displayPrompt = 'parsedTags' in prompt ? prompt : preparePromptForDisplay(prompt);
		const escapeHtml = (text: string) => {
			return text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		};
		let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(displayPrompt.name)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 1rem; }
    h1 { color: #333; }
    .metadata { background: #f5f5f5; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
    .content { white-space: pre-wrap; border-left: 4px solid #ddd; padding-left: 1rem; }
    .parameters { margin-top: 2rem; }
    .tag { background: #e1e1e1; padding: 0.2rem 0.5rem; border-radius: 3px; margin-right: 0.5rem; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(displayPrompt.name)}</h1>`;

		// Añadir metadatos si se solicitan
		if (includeMetadata) {
			html += `
  <div class="metadata">
    <p><strong>Categoría:</strong> ${escapeHtml(displayPrompt.category)}</p>
    <p><strong>Modelo:</strong> ${escapeHtml(displayPrompt.model)}</p>`;

			// Añadir tags si existen
			const tags: string[] = displayPrompt.tags || [];
			if (tags.length > 0) {
				html += `
    <p><strong>Tags:</strong> ${tags.map((tag: string) => `<span class="tag">${escapeHtml(tag)}</span>`).join(' ')}</p>`;
			}

			// Añadir información de fecha
			const createdAt =
				displayPrompt.createdAt instanceof Date
					? displayPrompt.createdAt.toISOString().split('T')[0]
					: String(displayPrompt.createdAt);

			html += `
    <p><strong>Creado:</strong> ${escapeHtml(createdAt)}</p>
  </div>`;
		}

		// Añadir contenido
		html += `
  <div class="content">${escapeHtml(displayPrompt.content)}</div>`;

		// Añadir parámetros si existen y se solicitan metadatos
		if (includeMetadata) {
			const parameters = displayPrompt.parsedParameters || {};
			if (Object.keys(parameters).length > 0) {
				html += `
  <div class="parameters">
    <h2>Parámetros</h2>
    <ul>`;
				for (const [key, value] of Object.entries(parameters)) {
					html += `
      <li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(JSON.stringify(value))}</li>`;
				}
				html += `
    </ul>
  </div>`;
			}
		}

		// Cerrar HTML
		html += `
</body>
</html>`;

		return html;
	} catch (error) {
		exportLogger.error('❌ Error al exportar prompt a HTML:', error);
		return `<html><body><h1>Error al exportar ${prompt.name}</h1></body></html>`;
	}
}

/**
 * Exporta un prompt al formato especificado
 * @param prompt Prompt a exportar
 * @param config Configuración de exportación
 * @returns Resultado de la exportación
 */
export function exportPrompt(prompt: PromptBase | PromptExtended, config: PromptExportConfig): PromptExportResult {
	try {
		const { format, includeMetadata = true } = config;
		const defaultFileName = `prompt-${prompt.id}-${Date.now()}`;
		let content: string;
		let mimeType: string;
		let fileExtension: string;

		// Exportar según el formato seleccionado
		switch (format) {
			case PromptExportFormat.JSON:
				content = exportPromptToJSON(prompt, includeMetadata);
				mimeType = 'application/json';
				fileExtension = 'json';
				break;

			case PromptExportFormat.MARKDOWN:
				content = exportPromptToMarkdown(prompt, includeMetadata);
				mimeType = 'text/markdown';
				fileExtension = 'md';
				break;

			case PromptExportFormat.TEXT:
				content = exportPromptToText(prompt, includeMetadata);
				mimeType = 'text/plain';
				fileExtension = 'txt';
				break;

			case PromptExportFormat.HTML:
				content = exportPromptToHTML(prompt, includeMetadata);
				mimeType = 'text/html';
				fileExtension = 'html';
				break;

			case PromptExportFormat.CSV: {
				// Implementación simplificada para CSV (solo una fila)
				const fields = [prompt.id, prompt.name, prompt.content, prompt.category, prompt.purpose];
				content = includeMetadata
					? `id,name,content,category,purpose\n"${fields.join('","')}"`
					: `"${prompt.name}","${prompt.content}"`;
				mimeType = 'text/csv';
				fileExtension = 'csv';
				break;
			}

			default:
				throw new Error(`Formato de exportación no soportado: ${format}`);
		}

		// Sanitizar el nombre del archivo
		const fileName = config.fileName
			? `${config.fileName.replace(/[^a-z0-9-_.]/gi, '_')}.${fileExtension}`
			: `${defaultFileName}.${fileExtension}`;

		return {
			content,
			mimeType,
			fileName,
			format,
		};
	} catch (error) {
		exportLogger.error('❌ Error al exportar prompt:', error);

		// Devolver un error en formato JSON como fallback
		return {
			content: JSON.stringify({ error: 'Error al exportar prompt', details: String(error) }, null, 2),
			mimeType: 'application/json',
			fileName: `error-export-${Date.now()}.json`,
			format: PromptExportFormat.JSON,
		};
	}
}

/**
 * Importa un prompt desde un contenido en formato JSON
 * @param content Contenido JSON a importar
 * @returns Prompt importado o null si hay error
 */
export function importPromptFromJSON(content: string): PromptBase | null {
	try {
		// Parsear el JSON
		const parsed = JSON.parse(content);

		// Verificar campos mínimos requeridos
		if (!parsed.name || !parsed.content) {
			throw new Error('El JSON no contiene un prompt válido (faltan name o content)');
		}

		// Asignar ID nuevo si no tiene o para evitar colisiones
		const id = `prompt_import_${Date.now()}`;

		// Crear objeto prompt con valores por defecto para campos faltantes
		const prompt: PromptBase = {
			id,
			name: parsed.name,
			emoji: parsed.emoji || '📝',
			color: parsed.color || '#3b82f6',
			description: parsed.description || null,
			content: parsed.content,
			model: parsed.model || '',
			category: parsed.category || 'GENERAL',
			parameters: parsed.parameters || {},
			tags: parsed.tags || [],
			featuredImage: parsed.featuredImage || null,
			isFavorite: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Si el prompt tiene formato extendido, prepararlo para guardar
		if ('parsedTags' in parsed || 'parsedParameters' in parsed) {
			return preparePromptForSaving(parsed as PromptExtended);
		}

		return prompt;
	} catch (error) {
		exportLogger.error('❌ Error al importar prompt desde JSON:', error);
		return null;
	}
}

/**
 * Genera un archivo de descarga a partir de un resultado de exportación
 * @param exportResult Resultado de exportación
 * @returns URL del blob para descargar
 */
export function generateDownloadURL(exportResult: PromptExportResult): string {
	try {
		// Crear blob con el contenido
		const blob = new Blob([exportResult.content], { type: exportResult.mimeType });

		// Crear URL para el blob
		return URL.createObjectURL(blob);
	} catch (error) {
		exportLogger.error('❌ Error al generar URL de descarga:', error);
		return '';
	}
}

/**
 * Descarga un prompt como archivo
 * @param exportResult Resultado de exportación
 */
export function downloadPrompt(exportResult: PromptExportResult): void {
	try {
		// Generar URL para descargar
		const url = generateDownloadURL(exportResult);
		if (!url) return;

		// Crear elemento <a> para descargar
		const link = document.createElement('a');
		link.href = url;
		link.download = exportResult.fileName;

		// Añadir link al documento, hacer clic y limpiar
		document.body.appendChild(link);
		link.click();
		setTimeout(() => {
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}, 100);
	} catch (error) {
		exportLogger.error('❌ Error al descargar prompt:', error);
	}
}
