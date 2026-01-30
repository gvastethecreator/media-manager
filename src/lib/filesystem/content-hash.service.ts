/**
 * @file Servicios de hash de contenido para detección de cambios
 * @module lib/filesystem/content-hash.service
 * @description Calcula y compara hashes de contenido para detectar cambios en archivos
 * @created 2025-10-11 - Sistema incremental de reindexado
 */

import * as crypto from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { Effect } from 'effect';
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('ContentHashService');

/**
 * Errores específicos del servicio de hash de contenido
 */
export class ContentHashError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly filePath?: string
	) {
		super(message);
		this.name = 'ContentHashError';
	}
}

/**
 * Resultado del cálculo de hash
 */
export interface ContentHashResult {
	/** Hash SHA-256 del contenido */
	hash: string;
	/** Tamaño del archivo en bytes */
	size: number;
	/** Fecha de modificación del archivo */
	modifiedAt: Date;
	/** Si el archivo cambió comparado con el hash anterior */
	hasChanged: boolean;
}

/**
 * Calcula el hash SHA-256 de un archivo
 */
export const calculateFileHash = (filePath: string): Effect.Effect<string, ContentHashError> =>
	Effect.gen(function* () {
		logger.debug(`🔢 Calculando hash para: ${filePath}`);

		const stats = yield* Effect.tryPromise({
			try: async () => await stat(filePath),
			catch: (error) => new ContentHashError(`Error al obtener stats del archivo: ${error}`, 'STAT_ERROR', filePath),
		});

		const fileBuffer = yield* Effect.tryPromise({
			try: async () => await readFile(filePath),
			catch: (error) => new ContentHashError(`Error al leer archivo: ${error}`, 'READ_ERROR', filePath),
		});

		const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

		logger.debug(`✅ Hash calculado: ${hash} (${stats.size} bytes)`);

		return hash;
	});

/**
 * Verifica si un archivo ha cambiado comparando hashes
 */
export const checkFileHashChanged = (
	filePath: string,
	previousHash?: string | null
): Effect.Effect<ContentHashResult, ContentHashError> =>
	Effect.gen(function* () {
		logger.debug(`🔍 Verificando cambios en: ${filePath}`);

		const currentHash = yield* calculateFileHash(filePath);
		const stats = yield* Effect.tryPromise({
			try: async () => await stat(filePath),
			catch: (error) => new ContentHashError(`Error al obtener stats del archivo: ${error}`, 'STAT_ERROR', filePath),
		});

		const hasChanged = !previousHash || currentHash !== previousHash;

		logger.debug(`${hasChanged ? '🔴' : '🟢'} Archivo ${hasChanged ? 'CAMBIÓ' : 'SIN CAMBIOS'}: ${filePath}`, {
			currentHash,
			previousHash,
		});

		return {
			hash: currentHash,
			size: stats.size,
			modifiedAt: stats.mtime,
			hasChanged,
		};
	});

/**
 * Calcula hashes para múltiples archivos en paralelo
 */
export const calculateMultipleFileHashes = (
	filePaths: string[],
	concurrency = 10
): Effect.Effect<Array<{ path: string; hash: string; size: number }>, ContentHashError> =>
	Effect.gen(function* () {
		logger.info(`🔢 Calculando hashes para ${filePaths.length} archivos (concurrency: ${concurrency})`);

		// Procesar archivos en lotes para limitar concurrencia
		const results: Array<{ path: string; hash: string; size: number }> = [];
		const chunks = [];

		for (let i = 0; i < filePaths.length; i += concurrency) {
			chunks.push(filePaths.slice(i, i + concurrency));
		}

		for (const chunk of chunks) {
			const chunkResults = yield* Effect.all(
				chunk.map((filePath) =>
					Effect.map(calculateFileHash(filePath), (hash) => ({
						path: filePath,
						hash,
						size: 0, // TODO: obtener size
					}))
				)
			);
			results.push(...chunkResults);
		}

		logger.info(`✅ ${results.length} hashes calculados`);

		return results;
	});

/**
 * Detecta archivos que han cambiado comparando hashes actuales con los almacenados
 */
export interface ChangedFileDetection {
	/** Ruta del archivo */
	path: string;
	/** Tipo de entidad */
	entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d';
	/** ID del archivo en la base de datos */
	id: string;
	/** Hash actual calculado */
	currentHash: string;
	/** Hash almacenado en la base de datos */
	storedHash: string;
	/** Tamaño actual del archivo */
	currentSize: number;
}

export const detectChangedFiles = (
	files: Array<{
		id: string;
		path: string;
		entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d';
		hash: string;
	}>
): Effect.Effect<ChangedFileDetection[], ContentHashError> =>
	Effect.gen(function* () {
		logger.info(`🔍 Detectando archivos cambiados: ${files.length} archivos`);

		// Calcular hashes actuales de todos los archivos
		const currentHashes = yield* calculateMultipleFileHashes(files.map((f) => f.path));

		// Comparar hashes actuales con los almacenados
		const changedFiles: ChangedFileDetection[] = [];

		for (const file of files) {
			const currentHash = currentHashes.find((h) => h.path === file.path);

			if (currentHash && currentHash.hash !== file.hash) {
				changedFiles.push({
					path: file.path,
					entityType: file.entityType,
					id: file.id,
					currentHash: currentHash.hash,
					storedHash: file.hash,
					currentSize: currentHash.size,
				});

				logger.info(`🔴 Archivo CAMBIÓ: ${file.path}`, {
					oldHash: file.hash,
					newHash: currentHash.hash,
				});
			}
		}

		logger.info(`✅ ${changedFiles.length} archivos detectados como cambiados`);

		return changedFiles;
	});

/**
 * Servicio de hash de contenido usando Effect-TS
 */
export class ContentHashService {
	static getInstance() {
		return new ContentHashService();
	}

	readonly calculateFileHash = calculateFileHash;
	readonly checkFileHashChanged = checkFileHashChanged;
	readonly detectChangedFiles = detectChangedFiles;
}

/**
 * Instancia singleton
 */
export const contentHashService = ContentHashService.getInstance();
