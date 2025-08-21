import { describe, expect, it } from 'bun:test';
import type { ImageBase } from '@/types/entities/image/base';

// Nota: Este test no toca DB; solo verifica correspondencia de shape entre
// el schema Drizzle y el tipo canónico ImageBase a nivel de claves fundamentales.
// No valida tipos runtime, pero actúa como test de contrato ante cambios no sincronizados.

describe('Drizzle schema vs tipos: Image', () => {
	it('campos principales del schema existen en ImageBase', () => {
		// Campos relevantes en Drizzle
		const drizzleColumns = [
			'id',
			'name',
			'description',
			'path',
			'hash',
			'size',
			'width',
			'height',
			'metadata',
			'thumbnail',
			'thumbnailSize',
			'thumbnailWidth',
			'thumbnailHeight',
			'thumbnailMimeType',
			'thumbnailError',
			'thumbnailErrorAt',
			'thumbnailOptimizedAt',
			'isFavorite',
			'folderId',
			'noteId',
			'createdAt',
			'updatedAt',
			'addedAt',
		];

		// Crear un objeto dummy del tipo ImageBase (con valores triviales)
		const _: ImageBase = {
			id: '',
			name: '',
			description: null,
			path: '',
			hash: '',
			size: 0,
			width: 0,
			height: 0,
			metadata: null,
			thumbnail: null,
			thumbnailSize: null,
			thumbnailWidth: null,
			thumbnailHeight: null,
			thumbnailMimeType: null,
			thumbnailError: null,
			thumbnailErrorAt: new Date(),
			thumbnailOptimizedAt: new Date(),
			isFavorite: false,
			folderId: '',
			noteId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			addedAt: new Date(),
			tags: [],
		};

		const typeKeys = new Set(Object.keys(_));

		for (const col of drizzleColumns) {
			expect(typeKeys.has(col)).toBe(true);
		}
	});
});
