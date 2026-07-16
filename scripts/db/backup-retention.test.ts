import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { appendFile, mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createVerifiedBackup } from './database-safety';
import { planBackupRetention, pruneVerifiedBackups } from './backup-retention';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) await rm(directory, { force: true, recursive: true });
});

describe('verified backup retention', () => {
	it('plans by manifest time, defaults to dry-run and audits confirmed deletion', async () => {
		const root = await mkdtemp(join(tmpdir(), 'media-manager-retention-'));
		temporaryDirectories.push(root);
		const workspaceRoot = join(root, 'workspace');
		const outputDirectory = join(root, 'backups');
		const databasePath = join(workspaceRoot, 'fixture.sqlite');
		await mkdir(workspaceRoot);
		const database = new Database(databasePath);
		database.exec("CREATE TABLE data(id TEXT PRIMARY KEY); INSERT INTO data VALUES ('kept');");
		database.close();

		const backups = [];
		for (const date of ['2026-07-01T00:00:00.000Z', '2026-07-02T00:00:00.000Z', '2026-07-03T00:00:00.000Z']) {
			backups.push(
				await createVerifiedBackup({
					databasePath,
					now: new Date(date),
					outputDirectory,
					workspaceRoot,
				})
			);
		}

		const plan = await planBackupRetention(outputDirectory, 1, workspaceRoot);
		expect(plan.keep.map((entry) => entry.createdAt)).toEqual(['2026-07-03T00:00:00.000Z']);
		expect(plan.delete).toHaveLength(2);
		const dryRun = await pruneVerifiedBackups({ keepCount: 1, outputDirectory, workspaceRoot });
		expect(dryRun.dryRun).toBe(true);
		expect((await readdir(outputDirectory)).filter((name) => name.endsWith('.sqlite'))).toHaveLength(3);

		const pruned = await pruneVerifiedBackups({
			confirm: 'PRUNE-VERIFIED-BACKUPS',
			keepCount: 1,
			outputDirectory,
			workspaceRoot,
		});
		expect(pruned.deleted).toHaveLength(2);
		expect((await readdir(outputDirectory)).filter((name) => name.endsWith('.sqlite'))).toHaveLength(1);
		const auditLines = (await readFile(join(outputDirectory, 'backup-retention.audit.jsonl'), 'utf8'))
			.trim()
			.split(/\r?\n/);
		expect(auditLines).toHaveLength(2);
		expect(auditLines.join(' ')).not.toContain(databasePath);
		expect(backups[2].manifest.createdAt).toBe('2026-07-03T00:00:00.000Z');
	});

	it('fails closed before deleting older valid backups when the newest retained backup is corrupt', async () => {
		const root = await mkdtemp(join(tmpdir(), 'media-manager-retention-corrupt-'));
		temporaryDirectories.push(root);
		const workspaceRoot = join(root, 'workspace');
		const outputDirectory = join(root, 'backups');
		const databasePath = join(workspaceRoot, 'fixture.sqlite');
		await mkdir(workspaceRoot);
		const database = new Database(databasePath);
		database.exec("CREATE TABLE data(id TEXT PRIMARY KEY); INSERT INTO data VALUES ('kept');");
		database.close();

		const backups = [];
		for (const date of ['2026-07-01T00:00:00.000Z', '2026-07-02T00:00:00.000Z', '2026-07-03T00:00:00.000Z']) {
			backups.push(await createVerifiedBackup({ databasePath, now: new Date(date), outputDirectory, workspaceRoot }));
		}
		await appendFile(backups[2].backupPath, 'corrupt');

		await expect(
			pruneVerifiedBackups({
				confirm: 'PRUNE-VERIFIED-BACKUPS',
				keepCount: 1,
				outputDirectory,
				workspaceRoot,
			})
		).rejects.toThrow();
		expect((await readdir(outputDirectory)).filter((name) => name.endsWith('.sqlite'))).toHaveLength(3);
		await expect(readFile(backups[0].backupPath)).resolves.toBeTruthy();
		await expect(readFile(backups[1].backupPath)).resolves.toBeTruthy();
	});
});
