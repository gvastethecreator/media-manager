import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import {
	ArtifactConflictError,
	createArtifactPathAuthority,
	ArtifactValidationError,
	buildArtifactPath,
	checkArtifactChanged,
	commitQuarantinedArtifact,
	computeArtifactHash,
	extractFrontmatter,
	generateFrontmatter,
	quarantineArtifactFile,
	readArtifactFile,
	renameArtifactFile,
	restoreQuarantinedArtifact,
	writeArtifactFile,
} from './file-backed.service';
import { createAuthorizedRootRegistry } from '@/server/security/authorized-roots';

const temporaryDirectories: string[] = [];

async function createRoot(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-artifact-'));
	temporaryDirectories.push(root);
	return root;
}

function artifactPath(root: string, absolutePath: string) {
	const relativePath = relative(root, absolutePath).split(sep).join('/');
	return createArtifactPathAuthority({ relativePath, rootId: 'test-root' }, async (reference) => {
		const candidate = resolve(root, ...reference.relativePath.split('/'));
		if (!(candidate === root || candidate.startsWith(`${root}${sep}`))) {
			throw new Error('test authority rejected a path outside its root');
		}
		return candidate;
	});
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 20, recursive: true, retryDelay: 50 });
	}
});

describe('file-backed taxonomy artifacts', () => {
	it('writes normalized UTF-8 through a same-directory atomic replacement', async () => {
		const root = await createRoot();
		const path = join(root, 'notes', 'artifact.md');
		const artifact = artifactPath(root, path);
		const result = await writeArtifactFile(artifact, '\uFEFFline one\r\nline two\r\n');

		expect(await readArtifactFile(artifact)).toBe('line one\nline two\n');
		expect(result).toEqual({
			byteSize: Buffer.byteLength('line one\nline two\n'),
			contentHash: computeArtifactHash('line one\nline two\n'),
		});
		expect(await readdir(join(root, 'notes'))).toEqual(['artifact.md']);
	});

	it('serializes conflicting writers and preserves an external edit', async () => {
		const root = await createRoot();
		const path = join(root, 'prompt.md');
		const artifact = artifactPath(root, path);
		const initial = await writeArtifactFile(artifact, 'initial');

		const writes = await Promise.allSettled([
			writeArtifactFile(artifact, 'first', { expectedHash: initial.contentHash }),
			writeArtifactFile(artifact, 'second', { expectedHash: initial.contentHash }),
		]);

		expect(writes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		const rejection = writes.find((result) => result.status === 'rejected');
		expect(rejection?.status === 'rejected' ? rejection.reason : null).toBeInstanceOf(ArtifactConflictError);
		expect(['first', 'second']).toContain(await readArtifactFile(artifact));
	});

	it('rejects invalid UTF-8, null bytes and oversized authored content', async () => {
		const root = await createRoot();
		const invalidPath = join(root, 'invalid.md');
		await writeFile(invalidPath, Buffer.from([0xc3, 0x28]));

		await expect(readArtifactFile(artifactPath(root, invalidPath))).rejects.toBeInstanceOf(ArtifactValidationError);
		await expect(writeArtifactFile(artifactPath(root, join(root, 'nul.md')), 'bad\0content')).rejects.toBeInstanceOf(
			ArtifactValidationError
		);
		await expect(
			writeArtifactFile(artifactPath(root, join(root, 'large.md')), 'x'.repeat(2 * 1024 * 1024 + 1))
		).rejects.toBeInstanceOf(ArtifactValidationError);
	});

	it('round-trips governed frontmatter without accepting unknown authored keys', () => {
		const metadata = {
			category: 'ideas',
			color: 'oklch(60% 0.2 250)',
			emoji: '🧭',
			id: 'prompt-stable-id',
			kind: 'prompt' as const,
			parameters: [
				{
					custom: true,
					default: 8,
					description: 'Number of migration steps',
					key: 'steps',
					type: 'number' as const,
				},
			],
			purpose: 'Plan "safe" migrations',
			schemaVersion: 1 as const,
			summary: 'A governed artifact',
			title: 'Migration planner',
		};
		const document = generateFrontmatter(metadata, 'Body\r\ntext {{steps}}');

		expect(extractFrontmatter(document)).toEqual({ metadata, body: 'Body\ntext {{steps}}' });
		expect(() => extractFrontmatter(document.replace('title:', 'invented: true\ntitle:'))).toThrow(
			ArtifactValidationError
		);
	});

	it('enforces the governed Prompt vocabulary, placeholders and Wildcard line contract', () => {
		expect(() =>
			generateFrontmatter(
				{
					id: 'prompt-1',
					kind: 'prompt',
					parameters: [{ custom: false, key: 'subject', required: true, type: 'text' }],
					purpose: 'Describe a subject',
					schemaVersion: 1,
					title: 'Prompt',
				},
				'No declared placeholder'
			)
		).toThrow(/requerido no usado/);
		expect(() =>
			generateFrontmatter(
				{ id: 'prompt-1', kind: 'prompt', purpose: 'Describe', schemaVersion: 1, title: 'Prompt' },
				'Unknown {{ghost}}'
			)
		).toThrow(/sin parameter declarado/);
		expect(() =>
			generateFrontmatter(
				{ id: 'prompt-1', kind: 'prompt', purpose: 'Describe', schemaVersion: 1, title: 'Prompt' },
				'Malformed {{subject'
			)
		).toThrow(/mal formado/);
		expect(() =>
			generateFrontmatter(
				{
					id: 'prompt-1',
					kind: 'prompt',
					parameters: [{ custom: true, key: 'local_key', type: 'text' }],
					purpose: 'Describe',
					schemaVersion: 1,
					title: 'Prompt',
				},
				'Body'
			)
		).toThrow(/requiere description/);
		expect(() =>
			extractFrontmatter(
				'---\nid: "prompt-1"\nkind: "prompt"\nschemaVersion: 1\ntitle: "Prompt"\npurpose: "Use"\nparameters: [{"custom":false,"key":"subject","type":"text","unknown":true}]\n---\n\n{{subject}}'
			)
		).toThrow(/no gobernado/);

		const wildcard = generateFrontmatter(
			{ id: 'wildcard-1', kind: 'wildcard', schemaVersion: 1, title: 'Colors' },
			'  rojo  \n\nverde\n'
		);
		expect(extractFrontmatter(wildcard).body).toBe('rojo\nverde');
		expect(() =>
			generateFrontmatter({ id: 'wildcard-1', kind: 'wildcard', schemaVersion: 1, title: 'Colors' }, 'rojo\nrojo')
		).toThrow(/duplicadas/);
	});

	it('builds portable paths and rejects identity/path injection', async () => {
		const root = await createRoot();
		expect(buildArtifactPath({ extension: '.md', rootDir: root }, 'stable-id')).toBe(join(root, 'stable-id.md'));
		expect(() => buildArtifactPath({ extension: '.md', rootDir: root }, '../escape')).toThrow(ArtifactValidationError);
		expect(() => buildArtifactPath({ extension: '../txt', rootDir: root }, 'stable-id')).toThrow(
			ArtifactValidationError
		);
	});

	it('renames and quarantines with optimistic conflict protection and rollback', async () => {
		const root = await createRoot();
		const source = join(root, 'wildcards', 'before.md');
		const destination = join(root, 'wildcards', 'after.md');
		const sourceArtifact = artifactPath(root, source);
		const destinationArtifact = artifactPath(root, destination);
		const initial = await writeArtifactFile(sourceArtifact, 'portable');

		const renamed = await renameArtifactFile(sourceArtifact, destinationArtifact, initial.contentHash);
		expect(renamed.contentHash).toBe(initial.contentHash);
		await expect(stat(source)).rejects.toMatchObject({ code: 'ENOENT' });

		const quarantine = await quarantineArtifactFile(destinationArtifact, initial.contentHash);
		await expect(stat(destination)).rejects.toMatchObject({ code: 'ENOENT' });
		await restoreQuarantinedArtifact(quarantine);
		expect(await readFile(destination, 'utf8')).toBe('portable');

		const secondQuarantine = await quarantineArtifactFile(destinationArtifact, initial.contentHash);
		await commitQuarantinedArtifact(secondQuarantine);
		await expect(stat(destination)).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(stat(await secondQuarantine.quarantine.resolve('existing'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('never overwrites an independently occupied rename destination', async () => {
		const root = await createRoot();
		const source = join(root, 'source.md');
		const destination = join(root, 'destination.md');
		const sourceArtifact = artifactPath(root, source);
		const destinationArtifact = artifactPath(root, destination);
		const sourceWrite = await writeArtifactFile(sourceArtifact, 'source authored');
		await writeArtifactFile(destinationArtifact, 'external winner', { createOnly: true });

		await expect(
			renameArtifactFile(sourceArtifact, destinationArtifact, sourceWrite.contentHash)
		).rejects.toBeInstanceOf(ArtifactConflictError);
		expect(await readFile(source, 'utf8')).toBe('source authored');
		expect(await readFile(destination, 'utf8')).toBe('external winner');
	});

	it('preserves an external winner that replaces the destination after the hard-link install', async () => {
		const root = await createRoot();
		const source = join(root, 'source.md');
		const destination = join(root, 'destination.md');
		const sourceArtifact = artifactPath(root, source);
		let replacedAfterInstall = false;
		const destinationArtifact = createArtifactPathAuthority(
			{ relativePath: 'destination.md', rootId: 'test-root' },
			async (_reference, mode) => {
				if (mode === 'existing' && !replacedAfterInstall) {
					replacedAfterInstall = true;
					await rm(destination);
					await writeFile(destination, 'external winner', 'utf8');
				}
				return destination;
			}
		);
		const sourceWrite = await writeArtifactFile(sourceArtifact, 'source authored');

		await expect(
			renameArtifactFile(sourceArtifact, destinationArtifact, sourceWrite.contentHash)
		).rejects.toBeInstanceOf(ArtifactConflictError);
		expect(replacedAfterInstall).toBe(true);
		expect(await readFile(source, 'utf8')).toBe('source authored');
		expect(await readFile(destination, 'utf8')).toBe('external winner');
	});

	it('revalidates root containment after a junction swap and does not write outside the root', async () => {
		const root = await createRoot();
		const outside = await createRoot();
		const taxonomyDirectory = join(root, 'taxonomy');
		const reference = { relativePath: 'taxonomy/notes/swap.md', rootId: 'root' };
		await mkdir(taxonomyDirectory);
		const registry = await createAuthorizedRootRegistry([
			{ id: 'root', path: root, permissions: ['read', 'write', 'delete', 'index'] },
		]);
		const artifact = createArtifactPathAuthority(
			reference,
			async (current, mode) => (await registry.resolve(current, 'write', mode)).absolutePath
		);

		// This is the old, stale authorization result. Storage must not use it.
		await registry.resolve(reference, 'write', 'create');
		await rm(taxonomyDirectory, { recursive: true });
		await symlink(outside, taxonomyDirectory, process.platform === 'win32' ? 'junction' : 'dir');

		await expect(writeArtifactFile(artifact, 'must stay governed')).rejects.toMatchObject({
			code: 'ROOT_PATH_OUTSIDE',
		});
		await expect(stat(join(outside, 'notes', 'swap.md'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('keeps the quarantine and external winner when restore finds an occupied canonical path', async () => {
		const root = await createRoot();
		const path = join(root, 'note.md');
		const artifact = artifactPath(root, path);
		const written = await writeArtifactFile(artifact, 'authored source');
		const quarantine = await quarantineArtifactFile(artifact, written.contentHash);
		await writeArtifactFile(artifact, 'external winner', { createOnly: true });

		await expect(restoreQuarantinedArtifact(quarantine)).rejects.toBeInstanceOf(ArtifactConflictError);
		expect(await readFile(path, 'utf8')).toBe('external winner');
		expect(await readFile(await quarantine.quarantine.resolve('existing'), 'utf8')).toBe('authored source');
	});

	it('reports sync, external change and missing states without changing the file', async () => {
		const root = await createRoot();
		const path = join(root, 'note.md');
		const artifact = artifactPath(root, path);
		const written = await writeArtifactFile(artifact, 'one');

		expect(await checkArtifactChanged(artifact, written.contentHash)).toMatchObject({
			needsReindex: false,
			status: 'synced',
		});
		await writeArtifactFile(artifact, 'two', { expectedHash: written.contentHash });
		expect(await checkArtifactChanged(artifact, written.contentHash)).toMatchObject({
			needsReindex: true,
			status: 'external_change',
		});
		await rm(path);
		expect(await checkArtifactChanged(artifact, written.contentHash)).toMatchObject({
			needsReindex: false,
			status: 'missing',
		});
	});
});
