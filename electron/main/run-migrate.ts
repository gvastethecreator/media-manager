import { spawnSync } from 'node:child_process';

export interface SpawnedMigrateResult {
	status: 'completed' | 'no-source' | 'already-completed' | 'failed';
	targetDb?: string;
	sourcePreserved?: boolean;
	error?: string;
}

export function runLibraryMigrate(input: {
	bunExecutable: string;
	script: string;
	sourceDb: string | null;
	targetDir: string;
}): SpawnedMigrateResult {
	const args = [input.script, '--target-dir', input.targetDir];
	if (input.sourceDb) args.push('--source', input.sourceDb);
	else args.push('--no-source');
	const result = spawnSync(input.bunExecutable, args, {
		encoding: 'utf8',
		windowsHide: true,
	});
	if (result.status !== 0) {
		return {
			error: (result.stderr || result.stdout || `migrate exited ${result.status}`).trim(),
			status: 'failed',
		};
	}
	const line = (result.stdout || '')
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.find((entry) => entry.startsWith('{'));
	if (!line) return { error: 'migrate produced no JSON result', status: 'failed' };
	return JSON.parse(line) as SpawnedMigrateResult;
}
