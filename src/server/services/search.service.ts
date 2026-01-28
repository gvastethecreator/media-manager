// Usar servicio de imágenes en lugar de server action

import { like, or, sql } from 'drizzle-orm';
import { Effect } from 'effect';
import { db, getDbClient } from '@/lib/drizzle';
import { isFts5Enabled } from '@/lib/drizzle/fts5';
import { files } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { convertServerImageToFileItem, type ServerImage } from '@/services/image/converter.service';
import { getAll } from '@/services/image/image.service.effect';
import type { FileItem } from '@/types/files';

const log = serverLogger.withContext('SearchService');

export async function searchImages(query: string, limit = 100): Promise<FileItem[]> {
	try {
		log.debug('🔎 Buscando imágenes', { query });
		const result = await Effect.runPromise(getAll({ search: query, limit, offset: 0 }));
		const items = result.images.map((img: any) => convertServerImageToFileItem(img as unknown as ServerImage));
		return items;
	} catch (error) {
		log.error('❌ Error buscando imágenes', error);
		return [];
	}
}

export type SearchEngine = 'fts5' | 'like';

export interface SearchFilesResult {
	items: Array<{ id: string; name: string; path: string; tags: string; score?: number }>;
	total: number;
	engine: SearchEngine;
}

export async function searchFilesFts(query: string, limit = 50, offset = 0): Promise<SearchFilesResult> {
	const started = performance.now();
	let rows: Array<{ id: string; name: string; path: string; tags: string; score?: number }> = [];
	let total = 0;
	let engine: SearchEngine = 'fts5';

	try {
		if (!isFts5Enabled()) {
			throw new Error('fts5-disabled');
		}
		const client = getDbClient();
		if (!client || typeof client.execute !== 'function') {
			throw new Error('client.execute no disponible');
		}
		const match = query.replace(/"/g, '');
		const querySql =
			'SELECT f.id, f.name, f.path, f.tags, bm25(files_fts) as score FROM files_fts ft JOIN File f ON f.rowid = ft.rowid WHERE ft MATCH ? ORDER BY score LIMIT ? OFFSET ?';
		const result = await client.execute({ sql: querySql, args: [match, limit, offset] });
		rows = result.rows.map((r: any) => ({
			id: String(r[0]),
			name: String(r[1]),
			path: String(r[2]),
			tags: String(r[3] ?? '[]'),
			score: Number(r[4]),
		}));
		total = rows.length + offset;
	} catch (e: any) {
		engine = 'like';
		const likeTerm = `%${query}%`;
		const data = await db
			.select({ id: files.id, name: files.name, path: files.path, tags: files.tags })
			.from(files)
			.where(or(like(files.name, likeTerm), like(files.path, likeTerm)))
			.limit(limit)
			.offset(offset);
		rows = data.map((r: any) => ({ id: r.id, name: r.name, path: r.path, tags: r.tags || '[]' }));
		const countResult = await db
			.select({ c: sql`COUNT(1)` })
			.from(files)
			.where(or(like(files.name, likeTerm), like(files.path, likeTerm)));
		total = Number(countResult?.[0]?.c ?? rows.length);
		const reason = e?.message === 'fts5-disabled' ? 'disabled' : 'error';
		log.info('search.like.fallback', { query, reason, rows: rows.length });
	}

	const took = performance.now() - started;
	log.debug('search.fts', { query, rows: rows.length, engine, ms: Math.round(took * 100) / 100 });

	return { items: rows, total, engine };
}
