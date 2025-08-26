/**
 * @file Servicio de thumbnails (re-encoder/optimizer legacy → esquema actual)
 * @module services/thumbnail
 */

import { count, eq, isNull, not } from 'drizzle-orm';
import PQueue from 'p-queue';
import sharp from 'sharp';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema/index';
import { optimizeThumbnail } from '@/lib/image/thumbnail';
import { serverLogger } from '@/lib/logger/server-logger';
import { imageService } from '@/services/image/image.service';
import type { ProcessOptions, ProcessStatus, ThumbnailError } from '@/types/thumbnails';

const log = serverLogger.withContext('ThumbnailReencoder');

type ProgressHandler = (status: ProcessStatus) => void;
type ErrorHandler = (error: ThumbnailError) => void;
type CompleteHandler = (data: Record<string, unknown>) => void;
type StatsHandler = (stats: Record<string, unknown>) => void;

/**
 * Servicio de re-encoding/optimización de thumbnails almacenados en DB (columna TEXT base64)
 */
class ThumbnailService {
	private progressHandlers: Set<ProgressHandler> = new Set();
	private errorHandlers: Set<ErrorHandler> = new Set();
	private completeHandlers: Set<CompleteHandler> = new Set();
	private statsHandlers: Set<StatsHandler> = new Set();

	private emitProgress(status: ProcessStatus) {
		for (const h of this.progressHandlers) h(status);
	}
	private emitError(error: ThumbnailError) {
		for (const h of this.errorHandlers) h(error);
	}
	private emitComplete(data: Record<string, unknown>) {
		for (const h of this.completeHandlers) h(data);
	}
	private emitStats(stats: Record<string, unknown>) {
		for (const h of this.statsHandlers) h(stats);
	}

	onProgress(handler: ProgressHandler) {
		this.progressHandlers.add(handler);
	}
	onError(handler: ErrorHandler) {
		this.errorHandlers.add(handler);
	}
	onComplete(handler: CompleteHandler) {
		this.completeHandlers.add(handler);
	}
	onStats(handler: StatsHandler) {
		this.statsHandlers.add(handler);
	}
	offProgress(handler: ProgressHandler) {
		this.progressHandlers.delete(handler);
	}
	offError(handler: ErrorHandler) {
		this.errorHandlers.delete(handler);
	}
	offComplete(handler: CompleteHandler) {
		this.completeHandlers.delete(handler);
	}
	offStats(handler: StatsHandler) {
		this.statsHandlers.delete(handler);
	}

	/**
	 * Valida si un string base64 representa una imagen legible por sharp.
	 */
	private async isValidBase64Image(b64: string): Promise<boolean> {
		try {
			const buf = Buffer.from(b64, 'base64');
			await sharp(buf).metadata();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Optimiza thumbnails existentes (base64) sin cambiar dimensiones.
	 * Evita animaciones (posible pérdida de cuadros con sharp).
	 */
	async optimizeThumbnails(options?: ProcessOptions) {
		const startedAt = Date.now();
		const maxConcurrency = options?.maxConcurrency && options.maxConcurrency > 0 ? options.maxConcurrency : 4;
		const queue = new PQueue({ concurrency: maxConcurrency });

		// Seleccionar imágenes con thumbnail no nulo
		const rows = await db
			.select({ id: images.id, thumbnail: images.thumbnail, thumbnailSize: images.thumbnailSize })
			.from(images)
			.where(not(isNull(images.thumbnail)));

		const total = rows.length;
		let processed = 0;
		let errors = 0;
		let savedBytes = 0;

		this.emitProgress({ processed, total, progress: total === 0 ? 1 : 0 });

		const tasks: Promise<void>[] = [];

		for (const row of rows) {
			tasks.push(
				queue.add(async () => {
					try {
						const b64 = row.thumbnail as unknown as string;
						const buf = Buffer.from(b64, 'base64');
						// Detectar animado; si es animado, saltar optimización para no perder cuadros
						let meta: sharp.Metadata | undefined;
						try {
							meta = await sharp(buf, { animated: true, failOn: 'none' }).metadata();
						} catch {
							meta = undefined;
						}
						if (meta && typeof meta.pages === 'number' && meta.pages > 1) {
							// Animado: solo registrar como válido y continuar
							processed += 1;
							this.emitProgress({ processed, total, progress: total > 0 ? processed / total : 1 });
							return;
						}

						const optimized = await optimizeThumbnail(buf);
						const optimizedB64 = optimized.data.toString('base64');

						// Guardar solo si difiere o mejora tamaño
						const originalSize = Number(row.thumbnailSize || buf.length);
						const newSize = optimized.size;
						if (newSize <= originalSize) {
							await db
								.update(images)
								.set({
									thumbnail: optimizedB64,
									thumbnailSize: newSize,
									thumbnailWidth: optimized.width,
									thumbnailHeight: optimized.height,
									thumbnailOptimizedAt: new Date(),
									thumbnailError: null,
								})
								.where(eq(images.id, row.id));
							savedBytes += originalSize - newSize;
						}

						processed += 1;
						this.emitProgress({ processed, total, progress: total > 0 ? processed / total : 1 });
					} catch (e: unknown) {
						errors += 1;
						this.emitError({
							message: e instanceof Error ? e.message : 'Error desconocido',
							code: 'OPTIMIZE_ERROR',
						});
						processed += 1;
						this.emitProgress({ processed, total, progress: total > 0 ? processed / total : 1 });
					}
				})
			);
		}

		await Promise.all(tasks);
		await queue.onIdle();

		const durationMs = Date.now() - startedAt;
		const result = { processed, errors, savedBytes, durationMs, total };
		this.emitStats(result);
		this.emitComplete({ action: 'optimize', ...result });
		log.info('Optimización de thumbnails completada', result);
		return result;
	}

	/**
	 * Reprocesar thumbnails: genera de nuevo los que falten o estén corruptos.
	 * Si forceRegenerate=true, regenera todos.
	 */
	async reprocessAll(options?: ProcessOptions) {
		const startedAt = Date.now();
		const maxConcurrency = options?.maxConcurrency && options.maxConcurrency > 0 ? options.maxConcurrency : 3;
		const forceAll = options?.forceRegenerate === true;
		const queue = new PQueue({ concurrency: maxConcurrency });

		// Candidatos: sin thumbnail o (si force) todos; si no force, detectar corruptos por validación ligera
		const baseSelect = db
			.select({ id: images.id, thumbnail: images.thumbnail })
			.from(images)
			.where(forceAll ? undefined : isNull(images.thumbnail));
		const list = await baseSelect;

		let extraCorrupt: { id: string; thumbnail: string | null }[] = [];
		if (!forceAll) {
			// Chequear un subconjunto con thumbnail para detectar corrupción
			const withThumb = await db
				.select({ id: images.id, thumbnail: images.thumbnail })
				.from(images)
				.where(not(isNull(images.thumbnail)));
			const validations: Promise<{ id: string; corrupt: boolean }>[] = [];
			for (const it of withThumb) {
				validations.push(
					(async () => {
						const b64 = it.thumbnail as unknown as string;
						const ok = await this.isValidBase64Image(b64);
						return { id: it.id, corrupt: !ok };
					})()
				);
			}
			const results = await Promise.all(validations);
			extraCorrupt = results.filter((r) => r.corrupt).map((r) => ({ id: r.id, thumbnail: null }));
		}

		// Unir listas (set para evitar duplicados)
		const ids = new Set<string>();
		for (const r of list) ids.add(r.id);
		for (const r of extraCorrupt) ids.add(r.id);
		const toProcess = Array.from(ids);

		const total = toProcess.length;
		let processed = 0;
		let errors = 0;
		this.emitProgress({ processed, total, progress: total === 0 ? 1 : 0 });

		const tasks: Promise<void>[] = [];
		for (const id of toProcess) {
			tasks.push(
				queue.add(async () => {
					try {
						await imageService.generateThumbnail(id);
					} catch (e: unknown) {
						errors += 1;
						this.emitError({ message: e instanceof Error ? e.message : 'Error desconocido', code: 'REPROCESS_ERROR' });
					} finally {
						processed += 1;
						this.emitProgress({ processed, total, progress: total > 0 ? processed / total : 1 });
					}
				})
			);
		}

		await Promise.all(tasks);
		await queue.onIdle();

		const durationMs = Date.now() - startedAt;
		const result = { processed, errors, durationMs, total };
		this.emitStats(result);
		this.emitComplete({ action: 'reprocess', ...result });
		log.info('Reprocesamiento de thumbnails completado', result);
		return result;
	}

	/**
	 * Limpia thumbnails inválidos en DB (base64 corrupto): los pone a null para permitir regeneración futura.
	 */
	async cleanThumbnails(options?: ProcessOptions) {
		const startedAt = Date.now();
		const maxConcurrency = options?.maxConcurrency && options.maxConcurrency > 0 ? options.maxConcurrency : 4;
		const queue = new PQueue({ concurrency: maxConcurrency });

		const rows = await db
			.select({ id: images.id, thumbnail: images.thumbnail })
			.from(images)
			.where(not(isNull(images.thumbnail)));

		const total = rows.length;
		let processed = 0;
		let errors = 0;
		let cleaned = 0;
		this.emitProgress({ processed, total, progress: total === 0 ? 1 : 0 });

		const tasks: Promise<void>[] = [];
		for (const row of rows) {
			tasks.push(
				queue.add(async () => {
					try {
						const ok = await this.isValidBase64Image(row.thumbnail as unknown as string);
						if (!ok) {
							await db
								.update(images)
								.set({
									thumbnail: null,
									thumbnailSize: null,
									thumbnailWidth: null,
									thumbnailHeight: null,
									thumbnailMimeType: null,
									thumbnailError: 'cleaned_invalid_base64',
									thumbnailErrorAt: new Date(),
								})
								.where(eq(images.id, row.id));
							cleaned += 1;
						}
					} catch (e: unknown) {
						errors += 1;
						this.emitError({ message: e instanceof Error ? e.message : 'Error desconocido', code: 'CLEAN_ERROR' });
					} finally {
						processed += 1;
						this.emitProgress({ processed, total, progress: total > 0 ? processed / total : 1 });
					}
				})
			);
		}

		await Promise.all(tasks);
		await queue.onIdle();

		const durationMs = Date.now() - startedAt;
		const result = { processed, errors, cleaned, durationMs, total };
		this.emitStats(result);
		this.emitComplete({ action: 'clean', ...result });
		log.info('Limpieza de thumbnails completada', result);
		return result;
	}

	/**
	 * Verificación de token firmado: placeholder.
	 */
	async verifySignedToken(token: string) {
		return {
			valid: false,
			token,
		};
	}

	/** Utilidades de métricas rápidas */
	async getCounts() {
		const [totalRows, withThumb, withoutThumb] = await Promise.all([
			db.select({ count: count() }).from(images),
			db
				.select({ count: count() })
				.from(images)
				.where(not(isNull(images.thumbnail))),
			db.select({ count: count() }).from(images).where(isNull(images.thumbnail)),
		]);
		return {
			total: totalRows[0]?.count || 0,
			withThumbnail: withThumb[0]?.count || 0,
			withoutThumbnail: withoutThumb[0]?.count || 0,
		};
	}
}

/**
 * Instancia singleton del servicio de thumbnails
 */
export const thumbnailService = new ThumbnailService();

// Exports de tipos
export type { ProcessOptions, ProcessStatus, ThumbnailError };
