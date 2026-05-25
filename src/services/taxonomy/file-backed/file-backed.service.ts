/**
 * @file File-Backed Artifact Service
 * @module services/taxonomy/file-backed
 * @description Infraestructura base para artefactos textuales file-backed (Prompt, Note, Wildcard).
 * Implementa ADR-0007: el archivo es fuente canónica del contenido authored.
 * La DB mantiene metadata operativa, indexación, y proyecciones de búsqueda.
 *
 * ESTADO: Infraestructura base creada. Los servicios concretos (Prompt/Note/Wildcard)
 * deben extender esta base para el modo file-backed.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('FileBackedService');

/**
 * Metadatos authored que viajan en el frontmatter del archivo.
 * Set canónico pequeño y gobernado por ADR-0007.
 */
export interface AuthoredMetadata {
	title: string;
	summary?: string;
	category?: string;
	emoji?: string;
	color?: string;
}

/**
 * Resultado de sincronización: compara contenido en archivo vs DB.
 */
export interface SyncResult {
	/** El archivo cambió y la DB necesita reindexar */
	needsReindex: boolean;
	/** Hash actual del archivo */
	currentHash: string;
	/** Hash anterior almacenado en DB */
	storedHash: string | null;
	/** Contenido crudo del archivo */
	content: string;
}

/**
 * Configuración de una familia de artefactos file-backed.
 */
export interface FileBackedConfig {
	/** Directorio raíz donde viven los archivos de esta familia */
	rootDir: string;
	/** Extensión de archivo (ej: '.md', '.txt') */
	extension: string;
}

/**
 * Lee un artefacto desde su archivo canónico.
 */
export async function readArtifactFile(filePath: string): Promise<string> {
	if (!existsSync(filePath)) {
		throw new Error(`Artifact file not found: ${filePath}`);
	}
	return readFile(filePath, 'utf-8');
}

/**
 * Escribe contenido authored al archivo canónico.
 * Crea directorios intermedios si no existen.
 */
export async function writeArtifactFile(filePath: string, content: string): Promise<void> {
	const dir = dirname(filePath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	await writeFile(filePath, content, 'utf-8');
	logger.info('Artifact file written', { path: filePath, size: content.length });
}

/**
 * Calcula SHA-256 hash del contenido para detectar cambios.
 */
export function computeArtifactHash(content: string): string {
	return createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * Compara el hash del archivo actual con el hash almacenado en DB.
 * Retorna true si el archivo cambió (necesita reindexar).
 */
export async function checkArtifactChanged(
	filePath: string,
	storedHash: string | null
): Promise<SyncResult> {
	const content = await readArtifactFile(filePath);
	const currentHash = computeArtifactHash(content);
	const needsReindex = currentHash !== storedHash;

	if (needsReindex) {
		logger.info('Artifact file changed, needs reindex', {
			path: filePath,
			storedHash,
			currentHash,
		});
	}

	return { needsReindex, currentHash, storedHash, content };
}

/**
 * Extrae metadata authored del frontmatter de un archivo Markdown.
 * Soporta formato YAML-like simple (--- delimiters).
 */
export function extractFrontmatter(content: string): {
	metadata: AuthoredMetadata;
	body: string;
} {
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

	if (!frontmatterMatch) {
		return {
			metadata: { title: '' },
			body: content,
		};
	}

	const [, rawMetadata, body] = frontmatterMatch;
	const metadata: AuthoredMetadata = { title: '' };

	for (const line of rawMetadata.split('\n')) {
		const colonIndex = line.indexOf(':');
		if (colonIndex === -1) continue;
		const key = line.slice(0, colonIndex).trim();
		const value = line.slice(colonIndex + 1).trim();

		switch (key) {
			case 'title':
				metadata.title = value.replace(/^["']|["']$/g, '');
				break;
			case 'summary':
				metadata.summary = value.replace(/^["']|["']$/g, '');
				break;
			case 'category':
				metadata.category = value;
				break;
			case 'emoji':
				metadata.emoji = value;
				break;
			case 'color':
				metadata.color = value;
				break;
		}
	}

	return { metadata, body };
}

/**
 * Genera contenido de archivo con frontmatter a partir de metadata + body.
 */
export function generateFrontmatter(metadata: AuthoredMetadata, body: string): string {
	const lines = ['---'];
	if (metadata.title) lines.push(`title: "${metadata.title}"`);
	if (metadata.summary) lines.push(`summary: "${metadata.summary}"`);
	if (metadata.category) lines.push(`category: ${metadata.category}`);
	if (metadata.emoji) lines.push(`emoji: ${metadata.emoji}`);
	if (metadata.color) lines.push(`color: ${metadata.color}`);
	lines.push('---');
	lines.push('');
	lines.push(body);

	return lines.join('\n');
}

/**
 * Construye el path canónico para un artefacto file-backed.
 */
export function buildArtifactPath(config: FileBackedConfig, artifactId: string): string {
	return join(config.rootDir, `${artifactId}${config.extension}`);
}
