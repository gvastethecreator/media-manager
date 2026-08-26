import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveHostBunExecutable } from '../electron/main/runtime-mode';

const workspaceRoot = resolve(import.meta.dir, '..');
const destRoot = resolve(process.env.EXTRA_RESOURCES_ROOT || join(workspaceRoot, 'electron', 'extra-resources'));

function assertNoSqlite(target: string) {
	const stats = statSync(target);
	if (stats.isDirectory()) {
		for (const entry of readdirSync(target)) assertNoSqlite(join(target, entry));
		return;
	}
	if (extname(target).toLowerCase() === '.sqlite') {
		throw new Error(`SQLite file is not allowed in extraResources: ${relative(workspaceRoot, target)}`);
	}
}

function copyDir(source: string, destination: string) {
	if (!existsSync(source)) return false;
	mkdirSync(destination, { recursive: true });
	cpSync(source, destination, { recursive: true });
	assertNoSqlite(destination);
	return true;
}

export function prepareExtraResources(options?: { destRoot?: string; workspaceRoot?: string }) {
	const root = options?.workspaceRoot ?? workspaceRoot;
	const dest = options?.destRoot ?? destRoot;
	if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
	mkdirSync(dest, { recursive: true });

	const bunExecutable = resolveHostBunExecutable();
	if (!existsSync(bunExecutable)) {
		throw new Error(`Cannot copy bun runtime: ${bunExecutable} is missing`);
	}
	const bunDestDir = join(dest, 'bun');
	mkdirSync(bunDestDir, { recursive: true });
	const bunName = process.platform === 'win32' ? 'bun.exe' : 'bun';
	cpSync(bunExecutable, join(bunDestDir, bunName));

	const migrationsSource = resolve(root, 'src/lib/drizzle/migrations');
	if (!copyDir(migrationsSource, join(dest, 'migrations'))) {
		throw new Error('Missing required extraResource: migrations');
	}
	const schemaContract = resolve(root, 'src/lib/drizzle/schema-contract.json');
	if (!existsSync(schemaContract)) {
		throw new Error('Missing required extraResource: schema-contract.json');
	}
	cpSync(schemaContract, join(dest, 'schema-contract.json'));

	const sharpSource = resolve(root, 'node_modules/sharp');
	if (!copyDir(sharpSource, join(dest, 'node_modules', 'sharp'))) {
		throw new Error('Missing required extraResource: sharp');
	}
	const imgSource = resolve(root, 'node_modules/@img');
	if (existsSync(imgSource)) {
		for (const entry of readdirSync(imgSource)) {
			if (!(entry.includes('sharp') || entry.includes('libvips'))) continue;
			copyDir(join(imgSource, entry), join(dest, 'node_modules', '@img', entry));
		}
	}

	copyDir(resolve(root, 'dist/client'), join(dest, 'client'));
	copyDir(resolve(root, 'dist/server'), join(dest, 'server'));

	const startOut = join(dest, 'start', 'start-production.js');
	const migrateOut = join(dest, 'start', 'migrate-library.js');
	mkdirSync(join(dest, 'start'), { recursive: true });
	const startBuild = spawnSync(bunExecutable, ['build', resolve(root, 'scripts/start-production.ts'), '--outfile', startOut, '--target', 'bun'], {
		cwd: root,
		encoding: 'utf8',
	});
	if (startBuild.status !== 0) {
		throw new Error(`Failed to bundle start-production: ${startBuild.stderr || startBuild.stdout}`);
	}
	const migrateBuild = spawnSync(bunExecutable, ['build', resolve(root, 'electron/main/data-migrate.ts'), '--outfile', migrateOut, '--target', 'bun'], {
		cwd: root,
		encoding: 'utf8',
	});
	if (migrateBuild.status !== 0) {
		throw new Error(`Failed to bundle migrate-library: ${migrateBuild.stderr || migrateBuild.stdout}`);
	}

	return dest;
}

if (import.meta.main) {
	const dest = prepareExtraResources();
	console.log(`prepared extraResources at ${dest}`);
}
