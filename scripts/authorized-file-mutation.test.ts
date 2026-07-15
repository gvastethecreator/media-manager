import { describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
	AuthorizedFileMutationError,
	commitAuthorizedFileRelocation,
} from '../src/server/security/authorized-file-mutation';
import {
	prepareFileMutationRecovery,
	type FileMutationRecoveryPrepareInput,
	type FileMutationRecoveryTransition,
} from '../src/server/security/file-mutation-recovery';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';

const TEST_ASSET = { assetId: 'asset-1', assetType: 'image' as const };

function createRecoveryRecorder(records: Array<Record<string, unknown>> = []) {
	return async (input: FileMutationRecoveryPrepareInput) => {
		records.push({ ...input, reasonCode: 'OPERATION_PREPARED', state: 'prepared' });
		return {
			id: 'test-recovery',
			transition: async (transition: FileMutationRecoveryTransition) => {
				records.push({ ...input, ...transition });
			},
		};
	};
}

async function withFixture(
	run: (fixture: {
		outside: string;
		primary: string;
		registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>;
	}) => Promise<void>
): Promise<void> {
	const container = await mkdtemp(resolve(tmpdir(), 'media-manager-file-mutation-'));
	const primary = resolve(container, 'primary');
	const outside = resolve(container, 'outside');
	await Promise.all([mkdir(resolve(primary, 'target'), { recursive: true }), mkdir(outside, { recursive: true })]);
	await writeFile(resolve(primary, 'source.txt'), 'source-content', 'utf8');
	const registry = await createAuthorizedRootRegistry([
		{
			id: 'primary',
			path: primary,
			permissions: ['read', 'index', 'write', 'delete'],
		},
	]);
	try {
		await run({ outside, primary, registry });
	} finally {
		await rm(container, { force: true, recursive: true });
	}
}

describe('authorized file relocation', () => {
	it('persists opaque recovery records without physical paths', async () => {
		const container = await mkdtemp(resolve(tmpdir(), 'media-manager-recovery-journal-'));
		const journalPath = resolve(container, 'recovery.jsonl');
		try {
			const recovery = await prepareFileMutationRecovery(
				{
					asset: TEST_ASSET,
					destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
					source: { relativePath: 'source.txt', rootId: 'primary' },
				},
				{ MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL: journalPath }
			);
			await recovery.transition({ reasonCode: 'TEST_RECOVERY', state: 'manual_recovery_required' });
			const serialized = await readFile(journalPath, 'utf8');
			const records = serialized
				.trim()
				.split(/\r?\n/)
				.map((line) => JSON.parse(line));
			expect(records.at(-1)).toMatchObject({
				reasonCode: 'TEST_RECOVERY',
				state: 'manual_recovery_required',
			});
			expect(serialized).not.toContain(container);
		} finally {
			await rm(container, { force: true, recursive: true });
		}
	});

	it('commits the database before deleting the only source pathname', async () => {
		await withFixture(async ({ primary, registry }) => {
			let sourceStillPresentDuringCommit = false;
			let destinationAbsentDuringPrepare = false;
			const recorder = createRecoveryRecorder();
			const result = await commitAuthorizedFileRelocation({
				asset: TEST_ASSET,
				commit: async () => {
					sourceStillPresentDuringCommit =
						(await readFile(resolve(primary, 'source.txt'), 'utf8')) === 'source-content';
				},
				destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
				prepareRecovery: async (input) => {
					destinationAbsentDuringPrepare = await readFile(resolve(primary, 'target/moved.txt'), 'utf8').then(
						() => false,
						(error) => (error as NodeJS.ErrnoException).code === 'ENOENT'
					);
					return recorder(input);
				},
				registry,
				rollbackCommit: async () => undefined,
				source: { relativePath: 'source.txt', rootId: 'primary' },
			});
			expect(sourceStillPresentDuringCommit).toBe(true);
			expect(destinationAbsentDuringPrepare).toBe(true);
			expect(result.cleanupPending).toBe(false);
			expect(await readFile(resolve(primary, 'target/moved.txt'), 'utf8')).toBe('source-content');
			await expect(readFile(resolve(primary, 'source.txt'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});

	it('never overwrites an existing destination or calls the database commit', async () => {
		await withFixture(async ({ primary, registry }) => {
			await writeFile(resolve(primary, 'target/moved.txt'), 'existing-content', 'utf8');
			let commitCalled = false;
			await expect(
				commitAuthorizedFileRelocation({
					asset: TEST_ASSET,
					commit: async () => {
						commitCalled = true;
					},
					destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
					prepareRecovery: createRecoveryRecorder(),
					registry,
					rollbackCommit: async () => undefined,
					source: { relativePath: 'source.txt', rootId: 'primary' },
				})
			).rejects.toMatchObject<Partial<AuthorizedFileMutationError>>({
				code: 'FILE_ALREADY_EXISTS',
				status: 409,
			});
			expect(commitCalled).toBe(false);
			expect(await readFile(resolve(primary, 'source.txt'), 'utf8')).toBe('source-content');
			expect(await readFile(resolve(primary, 'target/moved.txt'), 'utf8')).toBe('existing-content');
		});
	});

	it('removes only its staged destination when the database commit fails', async () => {
		await withFixture(async ({ primary, registry }) => {
			await expect(
				commitAuthorizedFileRelocation({
					asset: TEST_ASSET,
					commit: async () => {
						throw new Error('database unavailable');
					},
					destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
					prepareRecovery: createRecoveryRecorder(),
					registry,
					rollbackCommit: async () => undefined,
					source: { relativePath: 'source.txt', rootId: 'primary' },
				})
			).rejects.toThrow('database unavailable');
			expect(await readFile(resolve(primary, 'source.txt'), 'utf8')).toBe('source-content');
			await expect(readFile(resolve(primary, 'target/moved.txt'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});

	it('refuses to delete a source pathname replaced during the database commit', async () => {
		await withFixture(async ({ primary, registry }) => {
			const sourcePath = resolve(primary, 'source.txt');
			const recoveryRecords: unknown[] = [];
			const result = await commitAuthorizedFileRelocation({
				asset: TEST_ASSET,
				commit: async () => {
					await rm(sourcePath);
					await writeFile(sourcePath, 'replacement-content', 'utf8');
				},
				destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
				prepareRecovery: createRecoveryRecorder(recoveryRecords),
				registry,
				rollbackCommit: async () => undefined,
				source: { relativePath: 'source.txt', rootId: 'primary' },
			});
			expect(result.cleanupPending).toBe(true);
			expect(recoveryRecords).toContainEqual(
				expect.objectContaining({
					reasonCode: 'SOURCE_IDENTITY_CHANGED_OR_DELETE_FAILED',
					state: 'source_cleanup_pending',
				})
			);
			expect(await readFile(sourcePath, 'utf8')).toBe('replacement-content');
			expect(await readFile(resolve(primary, 'target/moved.txt'), 'utf8')).toBe('source-content');
		});
	});

	it('detects a destination parent swapped for a junction after commit and journals recovery', async () => {
		await withFixture(async ({ outside, primary, registry }) => {
			const targetPath = resolve(primary, 'target');
			const recoveryRecords: Array<{ reasonCode: string; state: string }> = [];
			let rollbackCalled = false;
			await expect(
				commitAuthorizedFileRelocation({
					asset: TEST_ASSET,
					commit: async () => {
						await rename(targetPath, resolve(primary, 'target-relocated'));
						await symlink(outside, targetPath, process.platform === 'win32' ? 'junction' : 'dir');
					},
					destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
					prepareRecovery: createRecoveryRecorder(recoveryRecords),
					registry,
					rollbackCommit: async () => {
						rollbackCalled = true;
					},
					source: { relativePath: 'source.txt', rootId: 'primary' },
				})
			).rejects.toMatchObject<Partial<AuthorizedFileMutationError>>({
				code: 'FILE_ROLLBACK_REQUIRED',
				status: 500,
			});
			expect(rollbackCalled).toBe(true);
			expect(recoveryRecords).toContainEqual(
				expect.objectContaining({
					reasonCode: expect.stringContaining('POST_COMMIT_REVALIDATION_FAILED'),
					state: 'manual_recovery_required',
				})
			);
			expect(await readFile(resolve(primary, 'source.txt'), 'utf8')).toBe('source-content');
			expect(await readFile(resolve(primary, 'target-relocated/moved.txt'), 'utf8')).toBe('source-content');
		});
	});

	it('aborta antes de tocar disco cuando el journal no puede preparar la operación', async () => {
		await withFixture(async ({ primary, registry }) => {
			let commitCalled = false;
			await expect(
				commitAuthorizedFileRelocation({
					asset: TEST_ASSET,
					commit: async () => {
						commitCalled = true;
					},
					destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
					prepareRecovery: async () => {
						throw Object.assign(new Error('journal unavailable'), { code: 'EACCES' });
					},
					registry,
					rollbackCommit: async () => undefined,
					source: { relativePath: 'source.txt', rootId: 'primary' },
				})
			).rejects.toThrow('journal unavailable');
			expect(commitCalled).toBe(false);
			expect(await readFile(resolve(primary, 'source.txt'), 'utf8')).toBe('source-content');
			await expect(readFile(resolve(primary, 'target/moved.txt'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});

	it('revierte base y staging si falla la transición durable posterior al commit', async () => {
		await withFixture(async ({ primary, registry }) => {
			let rollbackExpectedPath: string | undefined;
			await expect(
				commitAuthorizedFileRelocation({
					asset: TEST_ASSET,
					commit: async () => undefined,
					destination: { relativePath: 'target/moved.txt', rootId: 'primary' },
					prepareRecovery: async () => ({
						id: 'journal-transition-failure',
						transition: async (transition) => {
							if (transition.state === 'database_committed') throw new Error('journal unavailable after commit');
						},
					}),
					registry,
					rollbackCommit: async (expectedPath) => {
						rollbackExpectedPath = expectedPath;
					},
					source: { relativePath: 'source.txt', rootId: 'primary' },
				})
			).rejects.toThrow('journal unavailable after commit');
			expect(rollbackExpectedPath).toBe(resolve(primary, 'target/moved.txt'));
			expect(await readFile(resolve(primary, 'source.txt'), 'utf8')).toBe('source-content');
			await expect(readFile(resolve(primary, 'target/moved.txt'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});
});
