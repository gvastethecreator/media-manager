import { afterEach, describe, expect, it } from 'bun:test';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyExistingBackup, type DatabaseInventory } from './database-safety';
import { MIGRATIONS_DIRECTORY } from './migrations';
import type { UpgradeResult } from './upgrade';

const temporaryDirectories: string[] = [];

async function writeJournal(directory: string, tags: string[]): Promise<void> {
	await mkdir(join(directory, 'meta'), { recursive: true });
	await writeFile(
		join(directory, 'meta', '_journal.json'),
		JSON.stringify({ dialect: 'sqlite', entries: tags.map((tag, idx) => ({ idx, tag })), version: '7' })
	);
}

async function runUpgradeInChild(options: {
	backupDirectory: string;
	databasePath: string;
	migrationsDirectory?: string;
	outputPath: string;
	workspaceRoot: string;
}): Promise<{ exitCode: number; result?: UpgradeResult; stderr: string }> {
	const child = Bun.spawn(
		[
			process.execPath,
			join(import.meta.dir, 'fixtures', 'upgrade-database-child.ts'),
			options.databasePath,
			options.backupDirectory,
			options.outputPath,
			options.workspaceRoot,
			options.migrationsDirectory ?? '',
		],
		{ stderr: 'pipe', stdout: 'pipe' }
	);
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	return {
		exitCode,
		result: exitCode === 0 ? (JSON.parse(stdout) as UpgradeResult) : undefined,
		stderr,
	};
}

async function prepareSourceInChild(
	databasePath: string,
	migrationsDirectory: string,
	fixtureKind: 'profile' | 'stable'
): Promise<void> {
	const child = Bun.spawn(
		[
			process.execPath,
			join(import.meta.dir, 'fixtures', 'prepare-upgrade-source-child.ts'),
			databasePath,
			migrationsDirectory,
			fixtureKind,
		],
		{ stderr: 'pipe', stdout: 'ignore' }
	);
	const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
	if (exitCode !== 0) throw new Error(stderr || `source preparation failed with ${exitCode}`);
}

async function inventoryInChild(databasePath: string): Promise<DatabaseInventory> {
	const child = Bun.spawn(
		[process.execPath, join(import.meta.dir, 'fixtures', 'inventory-database-child.ts'), databasePath],
		{ stderr: 'pipe', stdout: 'pipe' }
	);
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	if (exitCode !== 0) throw new Error(stderr || `inventory failed with ${exitCode}`);
	return JSON.parse(stdout) as DatabaseInventory;
}

async function inspectUpgradedProfileInChild(databasePath: string): Promise<{ type: string } | null> {
	const child = Bun.spawn(
		[process.execPath, join(import.meta.dir, 'fixtures', 'inspect-upgraded-profile-child.ts'), databasePath],
		{ stderr: 'pipe', stdout: 'pipe' }
	);
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	if (exitCode !== 0) throw new Error(stderr || `profile inspection failed with ${exitCode}`);
	return JSON.parse(stdout) as { type: string } | null;
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('safe database upgrade', () => {
	it('backs up the source and publishes a verified migrated copy at a new path', async () => {
		const root = await mkdtemp(join(tmpdir(), 'media-manager-upgrade-'));
		temporaryDirectories.push(root);
		const workspaceRoot = join(root, 'workspace');
		const baselineDirectory = join(root, 'baseline');
		const sourcePath = join(workspaceRoot, 'source.sqlite');
		const outputPath = join(root, 'app-data', 'upgraded.sqlite');
		await mkdir(workspaceRoot);
		await mkdir(baselineDirectory);
		await copyFile(join(MIGRATIONS_DIRECTORY, '0000_baseline.sql'), join(baselineDirectory, '0000_baseline.sql'));
		await writeJournal(baselineDirectory, ['0000_baseline']);
		await prepareSourceInChild(sourcePath, baselineDirectory, 'profile');
		const before = await inventoryInChild(sourcePath);

		const child = await runUpgradeInChild({
			backupDirectory: join(root, 'backups'),
			databasePath: sourcePath,
			outputPath,
			workspaceRoot,
		});
		expect(child.exitCode).toBe(0);
		const result = child.result!;

		expect(result.outputPath).toBe(outputPath);
		expect(result.manifest.appVersion).toBe('0.1.0-test');
		expect(result.manifest.rootReferences).toEqual(['library']);
		expect(result.check.healthy).toBe(true);
		const sourceAfter = await inventoryInChild(sourcePath);
		expect(sourceAfter.schemaHash).toBe(before.schemaHash);
		expect(sourceAfter.userVersion).toBe(1);
		expect(result.check.migrations).toHaveLength(4);
		expect(await inspectUpgradedProfileInChild(outputPath)).toEqual({ type: 'integer' });
	});

	it('keeps source and verified backup while removing the unpublished copy after a failed migration', async () => {
		const root = await mkdtemp(join(tmpdir(), 'media-manager-upgrade-cut-'));
		temporaryDirectories.push(root);
		const workspaceRoot = join(root, 'workspace');
		const sourceMigrations = join(root, 'source-migrations');
		const failingMigrations = join(root, 'failing-migrations');
		const sourcePath = join(workspaceRoot, 'source.sqlite');
		const outputPath = join(root, 'app-data', 'must-not-publish.sqlite');
		const backupDirectory = join(root, 'backups');
		await mkdir(workspaceRoot);
		await mkdir(sourceMigrations);
		await mkdir(failingMigrations);
		const stableSql = 'CREATE TABLE stable (id TEXT PRIMARY KEY, value TEXT);';
		await writeFile(join(sourceMigrations, '0000_source.sql'), stableSql);
		await writeJournal(sourceMigrations, ['0000_source']);
		await writeFile(join(failingMigrations, '0000_source.sql'), stableSql);
		await writeFile(
			join(failingMigrations, '0001_cut.sql'),
			'CREATE TABLE transient (id TEXT);--> statement-breakpoint\nTHIS IS NOT SQL;'
		);
		await writeJournal(failingMigrations, ['0000_source', '0001_cut']);
		await prepareSourceInChild(sourcePath, sourceMigrations, 'stable');
		const before = await inventoryInChild(sourcePath);

		const child = await runUpgradeInChild({
			backupDirectory,
			databasePath: sourcePath,
			migrationsDirectory: failingMigrations,
			outputPath,
			workspaceRoot,
		});
		expect(child.exitCode).toBe(1);
		expect(child.stderr).not.toBe('');

		expect(existsSync(outputPath)).toBe(false);
		expect(await inventoryInChild(sourcePath)).toEqual(
			expect.objectContaining({
				schemaHash: before.schemaHash,
				tableCounts: before.tableCounts,
			})
		);
		const backupFiles = (await readdir(backupDirectory)).filter((name) => name.endsWith('.sqlite'));
		expect(backupFiles).toHaveLength(1);
		await expect(verifyExistingBackup({ backupPath: join(backupDirectory, backupFiles[0]) })).resolves.toBeTruthy();
	});
});
