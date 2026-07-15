import { describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
	createAuthorizedRootRegistry,
	parseAuthorizedRootGrants,
	RootAuthorizationError,
} from '../src/server/security/authorized-roots';

async function withFixture(
	run: (fixture: { outside: string; primary: string; secondary: string }) => Promise<void>
): Promise<void> {
	const container = await mkdtemp(resolve(tmpdir(), 'media-manager-roots-'));
	const primary = resolve(container, 'primary');
	const secondary = resolve(container, 'secondary');
	const outside = resolve(container, 'outside');
	await Promise.all([mkdir(primary), mkdir(secondary), mkdir(outside)]);
	await writeFile(resolve(primary, 'inside.txt'), 'inside', 'utf8');
	await writeFile(resolve(outside, 'secret.txt'), 'outside', 'utf8');
	try {
		await run({ outside, primary, secondary });
	} finally {
		await rm(container, { force: true, recursive: true });
	}
}

describe('authorized media roots', () => {
	it('parsea grants explícitos sin exponer rutas en descriptores', async () => {
		await withFixture(async ({ primary }) => {
			const parsed = parseAuthorizedRootGrants(
				JSON.stringify([{ id: 'library', label: 'Biblioteca', path: primary, permissions: ['read', 'index', 'read'] }])
			);
			const registry = await createAuthorizedRootRegistry(parsed);
			expect(registry.list()).toEqual([
				{
					allowCrossRoot: false,
					id: 'library',
					label: 'Biblioteca',
					permissions: ['read', 'index'],
				},
			]);
			expect(JSON.stringify(registry.list())).not.toContain(primary);
		});
	});

	it('resuelve existentes y destinos nuevos dentro del root', async () => {
		await withFixture(async ({ primary }) => {
			const registry = await createAuthorizedRootRegistry([
				{ id: 'library', path: primary, permissions: ['read', 'write'] },
			]);
			const existing = await registry.resolve({ rootId: 'library', relativePath: 'inside.txt' }, 'read');
			const destination = await registry.resolve(
				{ rootId: 'library', relativePath: 'new/deep/file.txt' },
				'write',
				'create'
			);
			expect(existing.relativePath).toBe('inside.txt');
			expect(existing.absolutePath).toBe(resolve(primary, 'inside.txt'));
			expect(destination.absolutePath).toBe(resolve(primary, 'new/deep/file.txt'));
		});
	});

	it('rechaza traversal, absolutos, UNC, device, separadores y escapes codificados', async () => {
		await withFixture(async ({ primary }) => {
			const registry = await createAuthorizedRootRegistry([{ id: 'library', path: primary, permissions: ['read'] }]);
			const hostilePaths = [
				'../secret.txt',
				'folder/../secret.txt',
				'/etc/passwd',
				'C:/Windows/win.ini',
				'\\\\server\\share\\file.txt',
				'\\\\?\\C:\\Windows\\win.ini',
				'folder\\file.txt',
				'folder/%2f/secret.txt',
				'folder/%5C/secret.txt',
				'folder//secret.txt',
				'folder/CON',
			];
			for (const relativePath of hostilePaths) {
				await expect(registry.resolve({ rootId: 'library', relativePath }, 'read')).rejects.toMatchObject({
					code: 'ROOT_PATH_INVALID',
				});
			}
		});
	});

	it('resuelve junctions/symlinks y bloquea los que escapan del root', async () => {
		await withFixture(async ({ outside, primary }) => {
			const escapePath = resolve(primary, 'escape');
			await symlink(outside, escapePath, process.platform === 'win32' ? 'junction' : 'dir');
			const registry = await createAuthorizedRootRegistry([{ id: 'library', path: primary, permissions: ['read'] }]);
			await expect(
				registry.resolve({ rootId: 'library', relativePath: 'escape/secret.txt' }, 'read')
			).rejects.toMatchObject({ code: 'ROOT_PATH_OUTSIDE' });
		});
	});

	it('separa permisos y falla cerrado ante roots desconocidos', async () => {
		await withFixture(async ({ primary }) => {
			const registry = await createAuthorizedRootRegistry([{ id: 'library', path: primary, permissions: ['read'] }]);
			await expect(registry.resolve({ rootId: 'library', relativePath: 'inside.txt' }, 'delete')).rejects.toMatchObject(
				{
					code: 'ROOT_PERMISSION_DENIED',
				}
			);
			await expect(registry.resolve({ rootId: 'unknown', relativePath: 'inside.txt' }, 'read')).rejects.toMatchObject({
				code: 'ROOT_NOT_FOUND',
			});
		});
	});

	it('autoriza paths absolutos sólo como dato interno contenido', async () => {
		await withFixture(async ({ outside, primary }) => {
			const registry = await createAuthorizedRootRegistry([{ id: 'library', path: primary, permissions: ['read'] }]);
			const authorized = await registry.authorizeAbsolutePath(resolve(primary, 'inside.txt'), 'read');
			expect(authorized).toMatchObject({ rootId: 'library', relativePath: 'inside.txt' });
			await expect(registry.authorizeAbsolutePath(resolve(outside, 'secret.txt'), 'read')).rejects.toMatchObject({
				code: 'ROOT_PATH_OUTSIDE',
			});
		});
	});

	it('exige opt-in bilateral para operaciones cross-root', async () => {
		await withFixture(async ({ primary, secondary }) => {
			await writeFile(resolve(secondary, 'target.txt'), 'target', 'utf8');
			const denied = await createAuthorizedRootRegistry([
				{ allowCrossRoot: true, id: 'primary', path: primary, permissions: ['read'] },
				{ id: 'secondary', path: secondary, permissions: ['write'] },
			]);
			await expect(
				denied.resolveTransfer(
					{ rootId: 'primary', relativePath: 'inside.txt' },
					{ rootId: 'secondary', relativePath: 'copy.txt' },
					{ sourcePermission: 'read', destinationPermission: 'write' }
				)
			).rejects.toMatchObject({ code: 'ROOT_CROSS_ROOT_FORBIDDEN' });

			const allowed = await createAuthorizedRootRegistry([
				{ allowCrossRoot: true, id: 'primary', path: primary, permissions: ['read'] },
				{ allowCrossRoot: true, id: 'secondary', path: secondary, permissions: ['write'] },
			]);
			const transfer = await allowed.resolveTransfer(
				{ rootId: 'primary', relativePath: 'inside.txt' },
				{ rootId: 'secondary', relativePath: 'copy.txt' },
				{ sourcePermission: 'read', destinationPermission: 'write' }
			);
			expect(transfer.source.rootId).toBe('primary');
			expect(transfer.destination.rootId).toBe('secondary');
		});
	});

	it('rechaza configuración inválida, duplicada, relativa y network/device', async () => {
		expect(() => parseAuthorizedRootGrants('{')).toThrow(RootAuthorizationError);
		expect(() =>
			parseAuthorizedRootGrants(JSON.stringify([{ id: 'root', path: '.', permissions: ['admin'] }]))
		).toThrow(RootAuthorizationError);
		await expect(
			createAuthorizedRootRegistry([{ id: 'relative', path: '.', permissions: ['read'] }])
		).rejects.toMatchObject({ code: 'ROOT_CONFIG_INVALID' });
		if (process.platform === 'win32') {
			await expect(
				createAuthorizedRootRegistry([{ id: 'unc', path: '\\\\server\\share', permissions: ['read'] }])
			).rejects.toMatchObject({ code: 'ROOT_CONFIG_INVALID' });
		}
	});

	it('rechaza roots anidados para impedir bypass de permisos por solapamiento', async () => {
		await withFixture(async ({ primary }) => {
			const nested = resolve(primary, 'nested');
			await mkdir(nested);
			await expect(
				createAuthorizedRootRegistry([
					{ id: 'outer', path: primary, permissions: ['read', 'delete'] },
					{ id: 'inner', path: nested, permissions: ['read'] },
				])
			).rejects.toMatchObject({ code: 'ROOT_CONFIG_INVALID' });
		});
	});
});
