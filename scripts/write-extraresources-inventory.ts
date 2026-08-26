import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dir, '..');
const treeRoot = resolve(process.env.EXTRA_RESOURCES_ROOT || join(workspaceRoot, 'electron', 'extra-resources'));
const outputPath = resolve(process.env.EXTRA_RESOURCES_INVENTORY_PATH || join(workspaceRoot, 'electron/resources/inventory.json'));
const outputDir = resolve(outputPath, '..');

const candidates = [
	{ key: 'bun-runtime', path: join(treeRoot, process.platform === 'win32' ? 'bun/bun.exe' : 'bun/bun'), required: true },
	{ key: 'client', path: join(treeRoot, 'client'), required: false },
	{ key: 'server', path: join(treeRoot, 'server'), required: false },
	{ key: 'migrations', path: join(treeRoot, 'migrations'), required: true },
	{ key: 'sharp', path: join(treeRoot, 'node_modules'), required: true },
	{ key: 'start', path: join(treeRoot, 'start'), required: true },
];

function hashPath(target: string): { hash: string; files: number } {
	const digest = createHash('sha256');
	let files = 0;
	const walk = (current: string) => {
		const stats = statSync(current);
		if (stats.isDirectory()) {
			for (const entry of readdirSync(current)) walk(join(current, entry));
			return;
		}
		if (extname(current).toLowerCase() === '.sqlite') {
			throw new Error(`SQLite file is not allowed in extraResources: ${relative(treeRoot, current)}`);
		}
		digest.update(readFileSync(current));
		files += 1;
	};
	walk(target);
	return { files, hash: digest.digest('hex') };
}

if (!existsSync(treeRoot)) {
	throw new Error(`extraResources tree is missing at ${treeRoot}. Run bun run desktop:prepare-resources first.`);
}

const entries = [];
for (const candidate of candidates) {
	if (!existsSync(candidate.path)) {
		if (candidate.required) throw new Error(`Missing required extraResource: ${candidate.key}`);
		entries.push({
			key: candidate.key,
			path: relative(treeRoot, candidate.path).replaceAll('\\', '/'),
			present: false,
			required: candidate.required,
		});
		continue;
	}
	const hashed = hashPath(candidate.path);
	entries.push({
		key: candidate.key,
		path: relative(treeRoot, candidate.path).replaceAll('\\', '/'),
		files: hashed.files,
		hash: hashed.hash,
		present: true,
		required: candidate.required,
	});
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(
	outputPath,
	`${JSON.stringify({ generatedAt: new Date().toISOString(), root: 'electron/extra-resources', entries, sqlite: false }, null, 2)}\n`
);
console.log(`wrote ${outputPath}`);
