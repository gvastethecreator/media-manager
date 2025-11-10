import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { Image } from '@/lib/drizzle';
import { db } from '@/lib/drizzle';
import { getEventStore } from '@/lib/server/events.server';
import { imageService } from '@/services/image/image.service';
import { createTestImage } from '../../factories';

// Factory para crear imágenes de test tipadas
const createTestImageWithDefaults = (overrides: Partial<Image> = {}): Image => {
	return createTestImage({
		id: 'img-1',
		name: 'file.jpg',
		path: 'test-files/test-photo.jpg',
		folderId: 'folder-1',
		size: 1234,
		width: 1000,
		height: 800,
		...overrides,
	});
};

// Mocks tipados (db y eventos)
let originalGenerateThumbnail: typeof imageService.generateThumbnail;

beforeEach(() => {
	// Mock generateThumbnail para evitar I/O pesado
	originalGenerateThumbnail = imageService.generateThumbnail.bind(imageService);
	(imageService as any).generateThumbnail = async (): Promise<void> => {
		// stub: evitar trabajo de sharp/FS
		await Promise.resolve();
	};
});

afterEach(() => {
	// Restaurar método parcheado
	(imageService as any).generateThumbnail = originalGenerateThumbnail;
});

// Helper tipado para stubear selects básicos
interface MockQueryResult<T> {
	from: (table: any) => MockQueryResult<T>;
	where: (condition: any) => MockQueryResult<T>;
	leftJoin: (condition: any) => MockQueryResult<T>;
	orderBy: (condition: any) => MockQueryResult<T>;
	limit: (count: number) => Promise<T[]>;
	offset: (count: number) => MockQueryResult<T>;
	execute: () => Promise<T[]>;
}

function stubDbForGetById(image: Image | null): void {
	(db as any).select = (): MockQueryResult<Image> => {
		const q: MockQueryResult<Image> = {
			from: () => q,
			where: () => q,
			leftJoin: () => q,
			orderBy: () => q,
			// Al await de la cadena, Drizzle devuelve el resultado; aquí lo emulamos en limit()
			limit: () => Promise.resolve(image ? [image] : []),
			offset: () => q,
			execute: () => Promise.resolve(image ? [image] : []),
		};
		return q;
	};
}

// Helper para stubear db.query.images.findFirst
function stubDbQueryFindFirst(record: Image | null): void {
	(db as any).query = {
		images: {
			findFirst: (): Promise<Image | null> => Promise.resolve(record),
		},
	};
}

// Helper para stubear insert/update/delete con tipos
interface MockMutationOptions {
	insertReturning?: Image;
	updateReturning?: Image;
}

function stubDbMutation({ insertReturning, updateReturning }: MockMutationOptions = {}): void {
	const defaultImage = createTestImageWithDefaults();

	(db as any).insert = (table: any) => ({
		values: (data: any) => ({
			returning: (): Promise<Image[]> => Promise.resolve([insertReturning ?? defaultImage]),
			execute: (): Promise<{ rowCount: number }> => Promise.resolve({ rowCount: 1 }),
		}),
	});

	(db as any).update = (table: any) => ({
		set: (data: any) => ({
			where: (condition: any) => ({
				returning: (): Promise<Image[]> => Promise.resolve([updateReturning ?? defaultImage]),
			}),
		}),
	});

	(db as any).delete = (table: any) => ({
		where: (condition: any) => ({
			execute: (): Promise<{ rowCount: number }> => Promise.resolve({ rowCount: 1 }),
		}),
	});
	(db as any).delete = (_table: any) => ({ where: (_: any) => ({ execute: () => Promise.resolve({ rowCount: 1 }) }) });
}

describe('ImageService - contratos básicos', () => {
	it('getImage devuelve ImageWithStats cuando existe', async () => {
		const base = createTestImageWithDefaults();
		stubDbForGetById(base);

		const result = await imageService.getImage(base.id);
		expect(result).not.toBeNull();
		expect(result?.id).toBe(base.id);
		// Validar campos base presentes (tipo de contrato mínimo)
		expect(result?.path).toBe(base.path);
		expect(result?.folderId).toBe(base.folderId);
	});

	it('getImage retorna null si no existe', async () => {
		stubDbForGetById(null);
		const result = await imageService.getImage('missing');
		expect(result).toBeNull();
	});

	it('createImage inserta, genera thumbnail y emite eventos', async () => {
		const base = createTestImageWithDefaults();
		// Insert returning new image
		stubDbMutation({ insertReturning: base, updateReturning: base });
		// getImage tras crear
		stubDbForGetById(base);
		// findFirst para generateThumbnail
		stubDbQueryFindFirst(base);
		const store = getEventStore();
		const before = store.get('images:modified')?.length ?? 0;

		const result = await imageService.createImage({
			name: base.name,
			path: base.path,
			size: base.size,
			width: base.width,
			height: base.height,
			hash: base.hash,
			folderId: base.folderId,
		});

		expect(result.id).toBe(base.id);
		const after = store.get('images:modified')?.length ?? 0;
		// created + images:changed (thumbnail se omitió por stub)
		expect(after - before).toBeGreaterThanOrEqual(2);
	});

	it('updateImage actualiza y emite eventos', async () => {
		const base = createTestImageWithDefaults();
		stubDbQueryFindFirst(base);
		stubDbMutation({ updateReturning: base });
		stubDbForGetById(base);
		const store = getEventStore();
		const before = store.get('images:modified')?.length ?? 0;

		const updated = await imageService.updateImage(base.id, { isFavorite: true } as any);
		expect(updated.id).toBe(base.id);
		const after = store.get('images:modified')?.length ?? 0;
		// updated + images:changed
		expect(after - before).toBeGreaterThanOrEqual(2);
	});

	it('deleteImage elimina cuando existe y emite', async () => {
		const base = createTestImageWithDefaults();
		// Proveer objeto completo para cumplir tipo esperado por stub
		stubDbQueryFindFirst(base);
		stubDbMutation({});
		const store = getEventStore();
		const before = store.get('images:modified')?.length ?? 0;

		await imageService.deleteImage(base.id);
		const after = store.get('images:modified')?.length ?? 0;
		// deleted + images:changed
		expect(after - before).toBeGreaterThanOrEqual(2);
	});
});
