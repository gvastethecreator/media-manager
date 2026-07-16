#!/usr/bin/env bun

import { appendFile, readFile, readdir, realpath, rm, stat } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { verifyExistingBackup } from './database-safety';

type RetentionCandidate = {
	backupPath: string;
	createdAt: string;
	manifestPath: string;
};

export type RetentionPlan = {
	delete: RetentionCandidate[];
	keep: RetentionCandidate[];
	outputDirectory: string;
};

function isInside(root: string, candidate: string): boolean {
	const pathFromRoot = relative(resolve(root), resolve(candidate));
	return pathFromRoot === '' || !(pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot));
}

async function assertExternalBackupDirectory(outputDirectory: string, workspaceRoot: string): Promise<string> {
	const [canonicalOutput, canonicalWorkspace] = await Promise.all([realpath(outputDirectory), realpath(workspaceRoot)]);
	if (isInside(canonicalWorkspace, canonicalOutput)) {
		throw new Error('La retención sólo opera sobre un directorio de backups fuera del workspace/Git.');
	}
	return canonicalOutput;
}

export async function planBackupRetention(
	outputDirectory: string,
	keepCount: number,
	workspaceRoot = process.cwd()
): Promise<RetentionPlan> {
	if (!Number.isSafeInteger(keepCount) || keepCount < 1 || keepCount > 1_000) {
		throw new Error('--keep debe ser un entero entre 1 y 1000.');
	}
	const canonicalOutput = await assertExternalBackupDirectory(outputDirectory, workspaceRoot);
	const entries = await readdir(canonicalOutput);
	const candidates: RetentionCandidate[] = [];
	const manifestFiles = entries.filter((name) => /^media-manager-backup-.*\.sqlite\.manifest\.json$/.test(name));
	const backupFiles = entries.filter((name) => /^media-manager-backup-.*\.sqlite$/.test(name));
	const referencedBackups = new Set<string>();
	for (const manifestFile of manifestFiles) {
		const manifestPath = join(canonicalOutput, manifestFile);
		const parsed = JSON.parse(await readFile(manifestPath, 'utf8')) as { backupFile?: unknown; createdAt?: unknown };
		if (typeof parsed.backupFile !== 'string' || basename(parsed.backupFile) !== parsed.backupFile) {
			throw new Error(`Manifest de retención inválido: ${manifestFile}`);
		}
		if (typeof parsed.createdAt !== 'string' || Number.isNaN(Date.parse(parsed.createdAt))) {
			throw new Error(`Manifest de retención sin createdAt válido: ${manifestFile}`);
		}
		const backupPath = join(canonicalOutput, parsed.backupFile);
		if (!isInside(canonicalOutput, backupPath) || !(await stat(backupPath).catch(() => null))) {
			throw new Error(`Manifest de retención sin backup asociado: ${manifestFile}`);
		}
		if (referencedBackups.has(parsed.backupFile)) {
			throw new Error(`Más de un manifest referencia el mismo backup: ${parsed.backupFile}`);
		}
		referencedBackups.add(parsed.backupFile);
		await verifyExistingBackup({ backupPath, manifestPath });
		candidates.push({ backupPath, createdAt: parsed.createdAt, manifestPath });
	}
	const unpairedBackups = backupFiles.filter((backupFile) => !referencedBackups.has(backupFile));
	if (unpairedBackups.length > 0) {
		throw new Error(`Backups sin manifest verificable: ${unpairedBackups.sort().join(', ')}`);
	}
	candidates.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
	return {
		delete: candidates.slice(keepCount),
		keep: candidates.slice(0, keepCount),
		outputDirectory: canonicalOutput,
	};
}

export async function pruneVerifiedBackups({
	confirm,
	keepCount,
	outputDirectory,
	workspaceRoot = process.cwd(),
}: {
	confirm?: string;
	keepCount: number;
	outputDirectory: string;
	workspaceRoot?: string;
}): Promise<{ deleted: string[]; dryRun: boolean; plan: RetentionPlan }> {
	const plan = await planBackupRetention(outputDirectory, keepCount, workspaceRoot);
	if (confirm !== 'PRUNE-VERIFIED-BACKUPS') return { deleted: [], dryRun: true, plan };
	// Verify every retained and deletable snapshot again before removing the first file. This keeps
	// retention fail-closed if any backup changed after planning and prevents a corrupt newest file
	// from displacing the last known-good copy.
	await Promise.all(
		[...plan.keep, ...plan.delete].map((candidate) =>
			verifyExistingBackup({ backupPath: candidate.backupPath, manifestPath: candidate.manifestPath })
		)
	);
	const deleted: string[] = [];
	const auditPath = join(plan.outputDirectory, 'backup-retention.audit.jsonl');
	for (const candidate of plan.delete) {
		const manifest = await verifyExistingBackup({
			backupPath: candidate.backupPath,
			manifestPath: candidate.manifestPath,
		});
		await rm(candidate.backupPath);
		await rm(candidate.manifestPath);
		deleted.push(basename(candidate.backupPath));
		await appendFile(
			auditPath,
			`${JSON.stringify({
				backupFile: basename(candidate.backupPath),
				deletedAt: new Date().toISOString(),
				manifestFile: basename(candidate.manifestPath),
				sha256: manifest.sha256,
			})}\n`,
			{ encoding: 'utf8' }
		);
	}
	return { deleted, dryRun: false, plan };
}

if (import.meta.main) {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			confirm: { type: 'string' },
			json: { type: 'boolean' },
			keep: { type: 'string' },
			output: { type: 'string' },
		},
		strict: true,
	});
	try {
		if (!values.output)
			throw new TypeError('Uso: db:backup:prune -- --output <externo> --keep <n> [--confirm PRUNE-VERIFIED-BACKUPS]');
		const result = await pruneVerifiedBackups({
			confirm: values.confirm,
			keepCount: Number(values.keep ?? '5'),
			outputDirectory: values.output,
		});
		console.log(
			values.json
				? JSON.stringify(result)
				: `${result.dryRun ? 'Dry-run' : 'Prune'}: ${result.plan.delete.length} candidato(s).`
		);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = error instanceof TypeError ? 2 : 1;
	}
}
