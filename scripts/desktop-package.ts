import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dir, '..');
const extraResourcesRoot = resolve(workspaceRoot, 'electron', 'extra-resources');
const stagingRoot = resolve(workspaceRoot, 'electron', 'package-staging');
const outRoot = resolve(workspaceRoot, 'out');

function requirePath(target: string, label: string) {
	if (!existsSync(target)) throw new Error(`Cannot package: missing ${label} at ${target}`);
}

requirePath(join(workspaceRoot, 'electron', 'dist', 'main.cjs'), 'electron main');
requirePath(join(workspaceRoot, 'electron', 'dist', 'preload.cjs'), 'electron preload');
requirePath(join(extraResourcesRoot, 'bun'), 'copied bun runtime');
requirePath(join(extraResourcesRoot, 'client', 'index.html'), 'copied client');
requirePath(join(extraResourcesRoot, 'server', 'index.js'), 'copied server');
requirePath(join(extraResourcesRoot, 'start', 'start-production.js'), 'copied start script');
requirePath(join(extraResourcesRoot, 'migrations'), 'copied migrations');
requirePath(join(extraResourcesRoot, 'schema-contract.json'), 'copied schema contract');
requirePath(join(extraResourcesRoot, 'node_modules', 'sharp'), 'copied sharp');

if (existsSync(stagingRoot)) rmSync(stagingRoot, { recursive: true, force: true });
mkdirSync(stagingRoot, { recursive: true });
cpSync(join(workspaceRoot, 'electron', 'dist', 'main.cjs'), join(stagingRoot, 'main.cjs'));
cpSync(join(workspaceRoot, 'electron', 'dist', 'preload.cjs'), join(stagingRoot, 'preload.cjs'));
writeFileSync(
	join(stagingRoot, 'package.json'),
	`${JSON.stringify(
		{
			name: 'media-manager',
			productName: 'Media Manager',
			version: '0.1.0',
			main: 'main.cjs',
		},
		null,
		2
	)}\n`
);

const electronVersion = (JSON.parse(readFileSync(join(workspaceRoot, 'node_modules/electron/package.json'), 'utf8')) as { version: string })
	.version;
const { packager } = await import('@electron/packager');
const paths = await packager({
	arch: 'x64',
	asar: false,
	dir: stagingRoot,
	electronVersion,
	extraResource: [extraResourcesRoot],
	name: 'Media Manager',
	out: outRoot,
	overwrite: true,
	platform: 'win32',
});

console.log(`packaged ${paths.join(', ')}`);
console.log('desktop package is unsigned');
