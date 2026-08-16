/**
 * @file Tests para DocumentService con Effect
 * @module services/document/__tests__/document.service.effect.test
 * @description Test suite completo para DocumentService usando Effect-TS
 */

import { Effect } from 'effect';
import { eq, inArray } from 'drizzle-orm';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { db } from '@/lib/drizzle';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import { assets, documents, favorites, folders, mediaRoots, profiles } from '@/lib/drizzle/schema';
import { getEventStore } from '@/lib/server/events.server';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { expectError, expectSuccess, generateTestId } from '../../../../tests/factories/test-helpers';
import * as DocumentService from '../document.service.effect';

// ============= Test Helpers =============

const createTestFolder = async (path = resolve(tmpdir(), `media-manager-document-${crypto.randomUUID()}`)) => {
	const now = new Date();
	const [folder] = await db
		.insert(folders)
		.values({
			id: crypto.randomUUID(),
			name: `test-folder-${Date.now()}`,
			path,
			depth: 0,
			parentId: null,
			isFavorite: false,
			presetId: null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return folder;
};

const withCanonicalSource = async <T extends { name: string }>(folder: typeof folders.$inferSelect, input: T) => {
	const rootId = `root-document-${crypto.randomUUID()}`;
	const path = resolve(folder.path, input.name);
	await db.insert(mediaRoots).values({ id: rootId, label: 'Document service test root' });
	return {
		...input,
		path,
		source: createAuthorizedPathInput({ absolutePath: path, relativePath: input.name, rootId }),
	};
};

const createTestDocument = async (folderId: string, overrides?: Partial<typeof documents.$inferInsert>) => {
	const now = new Date();
	const timestamp = Date.now().toString();
	const validHash = timestamp.padStart(64, '0');

	const [document] = await db
		.insert(documents)
		.values({
			id: crypto.randomUUID(),
			name: `test-doc-${Date.now()}.pdf`,
			path: `/test/doc-${Date.now()}.pdf`,
			hash: validHash,
			size: 1_024_000,
			mimeType: 'application/pdf',
			extension: 'pdf',
			folderId,
			isFavorite: false,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();
	return document;
};

let createdActiveProfileId: string | null = null;
let previousActiveProfileIds: string[] = [];

const ensureActiveProfile = async () => {
	if (createdActiveProfileId) {
		return createdActiveProfileId;
	}

	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}

	const profileId = `doc-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Document Service Test Profile',
		emoji: '📄',
		color: '#10b981',
		description: 'Perfil activo para tests de documentos',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.DOCUMENT));
	await db.delete(documents);
	await db.delete(assets);
	await db.delete(folders);
	await db.delete(mediaRoots);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
		previousActiveProfileIds = [];
	}
});

// ============= CRUD TESTS =============

describe('DocumentService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a document successfully', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = await withCanonicalSource(folder, {
				name: 'test-report.pdf',
				hash: validHash,
				size: 2_048_000,
				mimeType: 'application/pdf',
				extension: 'pdf',
				folderId: folder.id,
			});

			const result = await expectSuccess(DocumentService.create(input));

			expect(result.name).toBe(input.name);
			expect(result.path).toBe(input.path);
			expect(result.hash).toBe(input.hash);
			expect(result.size).toBe(input.size);
			expect(result.mimeType).toBe(input.mimeType);
			expect(result.extension).toBe(input.extension);
			expect(result.folderId).toBe(input.folderId);
			expect(result.isFavorite).toBe(false);
		});

		it('should create document with optional metadata', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = await withCanonicalSource(folder, {
				name: 'whitepaper.pdf',
				hash: validHash,
				size: 5_000_000,
				mimeType: 'application/pdf',
				extension: 'pdf',
				folderId: folder.id,
				title: 'Test Whitepaper',
				author: 'John Doe',
				subject: 'Research',
				language: 'en',
				pageCount: 42,
				wordCount: 15_000,
				content: 'Sample content of the whitepaper...',
				summary: 'A summary of the document',
			});

			const result = await expectSuccess(DocumentService.create(input));

			expect(result.title).toBe(input.title);
			expect(result.author).toBe(input.author);
			expect(result.subject).toBe(input.subject);
			expect(result.language).toBe(input.language);
			expect(result.pageCount).toBe(input.pageCount);
			expect(result.wordCount).toBe(input.wordCount);
			expect(result.content).toBe(input.content);
			expect(result.summary).toBe(input.summary);
		});

		it('should persist favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			await ensureActiveProfile();

			const result = await expectSuccess(
				DocumentService.create(
					await withCanonicalSource(folder, {
						name: 'favorite-doc.pdf',
						hash: validHash,
						size: 1_000_000,
						mimeType: 'application/pdf',
						extension: 'pdf',
						folderId: folder.id,
						isFavorite: true,
					})
				)
			);

			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, result.id)).toBe(true);
		});

		it('should fail with empty name', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: '',
				path: '/uploads/test.pdf',
				hash: validHash,
				size: 1024,
				mimeType: 'application/pdf',
				extension: 'pdf',
				folderId: folder.id,
			};

			const error = await expectError(DocumentService.create(input as any));
			expect(error._tag).toBe('DocumentValidationError');
		});

		it('should fail with empty path', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'test.pdf',
				path: '',
				hash: validHash,
				size: 1024,
				mimeType: 'application/pdf',
				extension: 'pdf',
				folderId: folder.id,
			};

			const error = await expectError(DocumentService.create(input as any));
			expect(error._tag).toBe('DocumentValidationError');
		});

		it('should fail with negative size', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'test.pdf',
				path: '/uploads/test.pdf',
				hash: validHash,
				size: -1,
				mimeType: 'application/pdf',
				extension: 'pdf',
				folderId: folder.id,
			};

			const error = await expectError(DocumentService.create(input as any));
			expect(error._tag).toBe('DocumentValidationError');
		});
	});

	describe('getById', () => {
		it('should retrieve a document by ID', async () => {
			const folder = await createTestFolder();
			const document = await createTestDocument(folder.id);

			const result = await expectSuccess(DocumentService.getById(document.id));

			expect(result.id).toBe(document.id);
			expect(result.name).toBe(document.name);
			expect(result.path).toBe(document.path);
		});

		it('should fail when document does not exist', async () => {
			const error = await expectError(DocumentService.getById('non-existent-id'));

			expect(error._tag).toBe('DocumentNotFound');
			if (error._tag === 'DocumentNotFound') {
				expect(error.id).toBe('non-existent-id');
			}
		});
	});

	describe('getByHash', () => {
		it('should find document by hash', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			const document = await createTestDocument(folder.id, { hash: validHash });

			const result = await expectSuccess(DocumentService.getByHash(validHash));

			expect(result).not.toBeNull();
			if (result) {
				expect(result.id).toBe(document.id);
				expect(result.hash).toBe(validHash);
			}
		});

		it('should return null when hash not found', async () => {
			const validHash = 'a'.padStart(64, '0');
			const result = await expectSuccess(DocumentService.getByHash(validHash));

			expect(result).toBeNull();
		});
	});

	describe('getByPathAndFolder', () => {
		it('should find document by path and folder', async () => {
			const folder = await createTestFolder();
			const path = '/unique/path/document.pdf';
			const document = await createTestDocument(folder.id, { path });

			const result = await expectSuccess(DocumentService.getByPathAndFolder(path, folder.id));

			expect(result).not.toBeNull();
			if (result) {
				expect(result.id).toBe(document.id);
				expect(result.path).toBe(path);
				expect(result.folderId).toBe(folder.id);
			}
		});

		it('should return null when path/folder combination not found', async () => {
			const folder = await createTestFolder();
			const result = await expectSuccess(DocumentService.getByPathAndFolder('/non-existent.pdf', folder.id));

			expect(result).toBeNull();
		});
	});

	describe('update', () => {
		it('should update document fields', async () => {
			const folder = await createTestFolder();
			const document = await createTestDocument(folder.id);
			await ensureActiveProfile();

			const update = {
				name: 'updated-doc.pdf',
				title: 'Updated Title',
				isFavorite: true,
			};
			const eventCountBefore = getEventStore().get('favorites:modified')?.length ?? 0;

			const result = await expectSuccess(DocumentService.update(document.id, update));
			const eventCountAfterChange = getEventStore().get('favorites:modified')?.length ?? 0;
			await expectSuccess(DocumentService.update(document.id, { isFavorite: true }));

			expect(result.name).toBe(update.name);
			expect(result.title).toBe(update.title);
			expect(result.isFavorite).toBe(true);
			expect(eventCountAfterChange - eventCountBefore).toBe(1);
			expect(getEventStore().get('favorites:modified')?.length ?? 0).toBe(eventCountAfterChange);
		});

		it('should update document metadata', async () => {
			const folder = await createTestFolder();
			const document = await createTestDocument(folder.id);

			const update = {
				author: 'Jane Smith',
				language: 'es',
				pageCount: 100,
				wordCount: 20_000,
			};

			const result = await expectSuccess(DocumentService.update(document.id, update));

			expect(result.author).toBe(update.author);
			expect(result.language).toBe(update.language);
			expect(result.pageCount).toBe(update.pageCount);
			expect(result.wordCount).toBe(update.wordCount);
		});

		it('should fail when updating non-existent document', async () => {
			const error = await expectError(DocumentService.update('non-existent-id', { name: 'test.pdf' }));

			expect(error._tag).toBe('DocumentNotFound');
		});
	});

	describe('delete', () => {
		it('should delete a document', async () => {
			const folder = await createTestFolder();
			const document = await createTestDocument(folder.id);

			await expectSuccess(DocumentService.delete(document.id));

			const error = await expectError(DocumentService.getById(document.id));
			expect(error._tag).toBe('DocumentNotFound');
		});

		it('should fail when deleting non-existent document', async () => {
			const error = await expectError(DocumentService.delete('non-existent-id'));

			expect(error._tag).toBe('DocumentNotFound');
		});
	});
});

// ============= QUERY OPERATIONS TESTS =============

describe('DocumentService - Query Operations', () => {
	describe('getAll', () => {
		it('should list all documents', async () => {
			const folder = await createTestFolder();
			await createTestDocument(folder.id);
			await createTestDocument(folder.id);
			await createTestDocument(folder.id);

			const result = await expectSuccess(DocumentService.getAll());

			expect(result.data.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			const folder = await createTestFolder();
			await createTestDocument(folder.id);
			await createTestDocument(folder.id);
			await createTestDocument(folder.id);
			await createTestDocument(folder.id);
			await createTestDocument(folder.id);

			const page1 = await expectSuccess(DocumentService.getAll({ limit: 2, offset: 0 }));
			expect(page1.data.length).toBe(2);
			expect(page1.total).toBe(5);

			const page2 = await expectSuccess(DocumentService.getAll({ limit: 2, offset: 2 }));
			expect(page2.data.length).toBe(2);

			const page3 = await expectSuccess(DocumentService.getAll({ limit: 2, offset: 4 }));
			expect(page3.data.length).toBe(1);
		});

		it('should filter by folderId', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();

			await createTestDocument(folder1.id);
			await createTestDocument(folder1.id);
			await createTestDocument(folder2.id);

			const result = await expectSuccess(DocumentService.getAll({ folderId: folder1.id }));

			expect(result.data.length).toBe(2);
			expect(result.total).toBe(2);
			expect(result.data.every((doc: any) => doc.folderId === folder1.id)).toBe(true);
		});

		it('should filter by isFavorite', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const favoriteDoc = await createTestDocument(folder.id, { isFavorite: false });
			await createTestDocument(folder.id, { isFavorite: true });
			await createTestDocument(folder.id, { isFavorite: false });

			await favoriteService.set(FavoriteEntityType.DOCUMENT, favoriteDoc.id, true);

			const result = await expectSuccess(DocumentService.getAll({ isFavorite: true }));

			expect(result.data.length).toBe(1);
			expect(result.data[0].id).toBe(favoriteDoc.id);
			const favResults = await Promise.all(
				result.data.map((doc: any) => favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, doc.id))
			);
			expect(favResults.every(Boolean)).toBe(true);
		});

		it('should search by name', async () => {
			const folder = await createTestFolder();
			await createTestDocument(folder.id, { name: 'financial-report-2024.pdf' });
			await createTestDocument(folder.id, { name: 'meeting-notes.pdf' });
			await createTestDocument(folder.id, { name: 'another-report.pdf' });

			const result = await expectSuccess(DocumentService.getAll({ search: 'report' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((doc: any) => doc.name.includes('report'))).toBe(true);
		});

		it('should sort by name ascending', async () => {
			const folder = await createTestFolder();
			await createTestDocument(folder.id, { name: 'C.pdf' });
			await createTestDocument(folder.id, { name: 'A.pdf' });
			await createTestDocument(folder.id, { name: 'B.pdf' });

			const result = await expectSuccess(DocumentService.getAll({ sortBy: 'name', sortOrder: 'asc' }));

			expect(result.data[0].name).toBe('A.pdf');
			expect(result.data[1].name).toBe('B.pdf');
			expect(result.data[2].name).toBe('C.pdf');
		});

		it('should sort by name descending', async () => {
			const folder = await createTestFolder();
			await createTestDocument(folder.id, { name: 'C.pdf' });
			await createTestDocument(folder.id, { name: 'A.pdf' });
			await createTestDocument(folder.id, { name: 'B.pdf' });

			const result = await expectSuccess(DocumentService.getAll({ sortBy: 'name', sortOrder: 'desc' }));

			expect(result.data[0].name).toBe('C.pdf');
			expect(result.data[1].name).toBe('B.pdf');
			expect(result.data[2].name).toBe('A.pdf');
		});

		it('should filter by mimeType', async () => {
			const folder = await createTestFolder();
			await createTestDocument(folder.id, { mimeType: 'application/pdf' });
			await createTestDocument(folder.id, {
				mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			});
			await createTestDocument(folder.id, { mimeType: 'application/pdf' });

			const result = await expectSuccess(DocumentService.getAll({ mimeType: 'application/pdf' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((doc: any) => doc.mimeType === 'application/pdf')).toBe(true);
		});

		it('should filter by extension', async () => {
			const folder = await createTestFolder();
			await createTestDocument(folder.id, { extension: 'pdf' });
			await createTestDocument(folder.id, { extension: 'docx' });
			await createTestDocument(folder.id, { extension: 'pdf' });

			const result = await expectSuccess(DocumentService.getAll({ extension: 'pdf' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((doc: any) => doc.extension === 'pdf')).toBe(true);
		});
	});
});

// ============= CONTENT DUPLICATE TESTS =============

describe('DocumentService - duplicate content', () => {
	it('creates distinct Assets for distinct locations with the same hash', async () => {
		const folder = await createTestFolder();
		const timestamp = Date.now().toString();
		const validHash = timestamp.padStart(64, '0');

		const first = await expectSuccess(
			DocumentService.create(
				await withCanonicalSource(folder, {
					name: 'first.pdf',
					hash: validHash,
					size: 1024,
					mimeType: 'application/pdf',
					extension: 'pdf',
					folderId: folder.id,
				})
			)
		);

		const second = await expectSuccess(
			DocumentService.create(
				await withCanonicalSource(folder, {
					name: 'second.pdf',
					hash: validHash,
					size: 2048,
					mimeType: 'application/pdf',
					extension: 'pdf',
					folderId: folder.id,
				})
			)
		);

		expect(second.id).not.toBe(first.id);
		expect(second.hash).toBe(first.hash);
	});
});
