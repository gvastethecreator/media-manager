import { lstat, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep, win32 } from 'node:path';

export const ROOT_GRANTS_ENV = 'MEDIA_MANAGER_ROOT_GRANTS';

export const ROOT_PERMISSIONS = ['read', 'index', 'write', 'delete', 'export'] as const;
export type RootPermission = (typeof ROOT_PERMISSIONS)[number];

export interface AuthorizedRootGrantInput {
	allowCrossRoot?: boolean;
	id: string;
	label?: string;
	path: string;
	permissions: RootPermission[];
}

interface AuthorizedRootGrant {
	allowCrossRoot: boolean;
	id: string;
	label: string;
	permissions: ReadonlySet<RootPermission>;
	realPath: string;
}

export interface AuthorizedRootDescriptor {
	allowCrossRoot: boolean;
	id: string;
	label: string;
	permissions: RootPermission[];
}

export interface AuthorizedPathReference {
	relativePath: string;
	rootId: string;
}

export interface ResolvedAuthorizedPath extends AuthorizedPathReference {
	absolutePath: string;
}

export type AuthorizedPathMode = 'create' | 'existing';

export type RootAuthorizationErrorCode =
	| 'ROOT_CONFIG_INVALID'
	| 'ROOT_CROSS_ROOT_FORBIDDEN'
	| 'ROOT_NOT_FOUND'
	| 'ROOT_PATH_INVALID'
	| 'ROOT_PATH_NOT_FOUND'
	| 'ROOT_PATH_OUTSIDE'
	| 'ROOT_PERMISSION_DENIED';

export class RootAuthorizationError extends Error {
	readonly code: RootAuthorizationErrorCode;
	readonly status: number;

	constructor(code: RootAuthorizationErrorCode, message: string, status: number) {
		super(message);
		this.name = 'RootAuthorizationError';
		this.code = code;
		this.status = status;
	}
}

const WINDOWS_DEVICE_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const WINDOWS_DEVICE_PREFIX = /^(?:\\\\[.?]\\|\\\?\?\\|\/\/)/;
const WINDOWS_DRIVE_PREFIX = /^[a-zA-Z]:/;
const ENCODED_PATH_TOKEN = /%(?:[0-9a-fA-F]{2})/;

function configError(message: string): RootAuthorizationError {
	return new RootAuthorizationError('ROOT_CONFIG_INVALID', message, 500);
}

function normalizeForComparison(path: string): string {
	const normalized = resolve(path);
	return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized;
}

function isContained(root: string, candidate: string): boolean {
	const comparableRoot = normalizeForComparison(root);
	const comparableCandidate = normalizeForComparison(candidate);
	return comparableCandidate === comparableRoot || comparableCandidate.startsWith(`${comparableRoot}${sep}`);
}

function assertLocalAbsolutePath(path: string): void {
	if (!path || path.includes('\0') || WINDOWS_DEVICE_PREFIX.test(path)) {
		throw configError('Cada media root debe ser una ruta local absoluta válida.');
	}
	if (process.platform === 'win32') {
		if (!(win32.isAbsolute(path) && WINDOWS_DRIVE_PREFIX.test(path))) {
			throw configError('Los media roots UNC, device o relativos no están permitidos.');
		}
		return;
	}
	if (!isAbsolute(path)) throw configError('Cada media root debe ser una ruta local absoluta.');
}

function normalizeRelativePath(input: unknown): string {
	if (typeof input !== 'string') {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', 'La ruta relativa es obligatoria.', 400);
	}
	if (
		input.includes('\0') ||
		input.includes('\\') ||
		input.startsWith('/') ||
		WINDOWS_DRIVE_PREFIX.test(input) ||
		WINDOWS_DEVICE_PREFIX.test(input) ||
		ENCODED_PATH_TOKEN.test(input)
	) {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', 'La ruta relativa contiene una forma no permitida.', 400);
	}
	if (input === '') return '';
	const segments = input.split('/');
	for (const segment of segments) {
		if (
			!segment ||
			segment === '.' ||
			segment === '..' ||
			segment.endsWith('.') ||
			segment.endsWith(' ') ||
			/[<>:"|?*]/.test(segment) ||
			WINDOWS_DEVICE_NAME.test(segment)
		) {
			throw new RootAuthorizationError('ROOT_PATH_INVALID', 'La ruta relativa contiene un segmento no permitido.', 400);
		}
	}
	return segments.join('/');
}

function parseGrant(value: unknown, index: number): AuthorizedRootGrantInput {
	if (!(value && typeof value === 'object' && !Array.isArray(value))) {
		throw configError(`El media root ${index + 1} no es un objeto válido.`);
	}
	const candidate = value as Record<string, unknown>;
	if (typeof candidate.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(candidate.id)) {
		throw configError(`El media root ${index + 1} requiere un ID opaco válido.`);
	}
	if (typeof candidate.path !== 'string') throw configError(`El media root ${candidate.id} requiere path.`);
	if (!Array.isArray(candidate.permissions) || candidate.permissions.length === 0) {
		throw configError(`El media root ${candidate.id} requiere permisos explícitos.`);
	}
	const permissions: RootPermission[] = [];
	for (const permission of candidate.permissions) {
		if (!(typeof permission === 'string' && ROOT_PERMISSIONS.includes(permission as RootPermission))) {
			throw configError(`El media root ${candidate.id} contiene un permiso desconocido.`);
		}
		if (!permissions.includes(permission as RootPermission)) permissions.push(permission as RootPermission);
	}
	if (candidate.label !== undefined && typeof candidate.label !== 'string') {
		throw configError(`El label del media root ${candidate.id} no es válido.`);
	}
	if (candidate.allowCrossRoot !== undefined && typeof candidate.allowCrossRoot !== 'boolean') {
		throw configError(`allowCrossRoot del media root ${candidate.id} no es válido.`);
	}
	return {
		allowCrossRoot: candidate.allowCrossRoot === true,
		id: candidate.id,
		label: candidate.label?.trim() || candidate.id,
		path: candidate.path,
		permissions,
	};
}

export function parseAuthorizedRootGrants(value: string | undefined): AuthorizedRootGrantInput[] {
	if (!value?.trim()) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw configError(`${ROOT_GRANTS_ENV} debe ser JSON válido.`);
	}
	if (!Array.isArray(parsed)) throw configError(`${ROOT_GRANTS_ENV} debe ser un array JSON.`);
	return parsed.map(parseGrant);
}

async function resolveExistingPath(candidate: string): Promise<string> {
	try {
		return await realpath(candidate);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'El recurso solicitado no existe.', 404);
		}
		throw error;
	}
}

async function resolveCreatePath(root: string, candidate: string): Promise<string> {
	let ancestor = candidate;
	while (true) {
		try {
			const ancestorStat = await lstat(ancestor);
			const canonicalAncestor = await realpath(ancestor);
			if (!isContained(root, canonicalAncestor)) {
				throw new RootAuthorizationError('ROOT_PATH_OUTSIDE', 'La ruta resuelve fuera del media root.', 403);
			}
			// Existing destinations are still authorized here; the mutating primitive must reject
			// collisions atomically instead of turning an existence check into a race.
			if (ancestor === candidate) return canonicalAncestor;
			if (!ancestorStat.isDirectory()) {
				throw new RootAuthorizationError('ROOT_PATH_INVALID', 'El destino no tiene un directorio padre válido.', 400);
			}
			return candidate;
		} catch (error) {
			if (error instanceof RootAuthorizationError) throw error;
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			const parent = resolve(ancestor, '..');
			if (parent === ancestor || !isContained(root, parent)) {
				throw new RootAuthorizationError('ROOT_PATH_OUTSIDE', 'La ruta resuelve fuera del media root.', 403);
			}
			ancestor = parent;
		}
	}
}

export class AuthorizedRootRegistry {
	readonly #grants: ReadonlyMap<string, AuthorizedRootGrant>;

	constructor(grants: AuthorizedRootGrant[]) {
		this.#grants = new Map(grants.map((grant) => [grant.id, grant]));
	}

	list(): AuthorizedRootDescriptor[] {
		return [...this.#grants.values()].map((grant) => ({
			allowCrossRoot: grant.allowCrossRoot,
			id: grant.id,
			label: grant.label,
			permissions: ROOT_PERMISSIONS.filter((permission) => grant.permissions.has(permission)),
		}));
	}

	async resolve(
		reference: AuthorizedPathReference,
		permission: RootPermission,
		mode: AuthorizedPathMode = 'existing'
	): Promise<ResolvedAuthorizedPath> {
		const grant = this.#grants.get(reference.rootId);
		if (!grant) throw new RootAuthorizationError('ROOT_NOT_FOUND', 'Media root no autorizado.', 404);
		if (!grant.permissions.has(permission)) {
			throw new RootAuthorizationError('ROOT_PERMISSION_DENIED', 'El media root no concede esta operación.', 403);
		}
		const relativePath = normalizeRelativePath(reference.relativePath);
		const candidate = resolve(grant.realPath, ...relativePath.split('/').filter(Boolean));
		if (!isContained(grant.realPath, candidate)) {
			throw new RootAuthorizationError('ROOT_PATH_OUTSIDE', 'La ruta resuelve fuera del media root.', 403);
		}
		const absolutePath =
			mode === 'existing' ? await resolveExistingPath(candidate) : await resolveCreatePath(grant.realPath, candidate);
		if (!isContained(grant.realPath, absolutePath)) {
			throw new RootAuthorizationError('ROOT_PATH_OUTSIDE', 'La ruta resuelve fuera del media root.', 403);
		}
		return { absolutePath, relativePath, rootId: grant.id };
	}

	async authorizeAbsolutePath(absolutePath: string, permission: RootPermission): Promise<ResolvedAuthorizedPath> {
		assertLocalAbsolutePath(absolutePath);
		const canonicalPath = await resolveExistingPath(absolutePath);
		const candidates = [...this.#grants.values()]
			.filter((grant) => isContained(grant.realPath, canonicalPath))
			.sort((left, right) => right.realPath.length - left.realPath.length);
		const grant = candidates.find((candidate) => candidate.permissions.has(permission));
		if (!grant)
			throw new RootAuthorizationError('ROOT_PATH_OUTSIDE', 'El recurso no pertenece a un media root autorizado.', 403);
		const relativePath = relative(grant.realPath, canonicalPath).split(sep).join('/');
		return { absolutePath: canonicalPath, relativePath, rootId: grant.id };
	}

	async resolveTransfer(
		source: AuthorizedPathReference,
		destination: AuthorizedPathReference,
		options: { destinationPermission: RootPermission; sourcePermission: RootPermission }
	): Promise<{ destination: ResolvedAuthorizedPath; source: ResolvedAuthorizedPath }> {
		const [resolvedSource, resolvedDestination] = await Promise.all([
			this.resolve(source, options.sourcePermission, 'existing'),
			this.resolve(destination, options.destinationPermission, 'create'),
		]);
		if (resolvedSource.rootId !== resolvedDestination.rootId) {
			const sourceGrant = this.#grants.get(resolvedSource.rootId);
			const destinationGrant = this.#grants.get(resolvedDestination.rootId);
			if (!(sourceGrant?.allowCrossRoot && destinationGrant?.allowCrossRoot)) {
				throw new RootAuthorizationError(
					'ROOT_CROSS_ROOT_FORBIDDEN',
					'La operación entre media roots no está autorizada.',
					403
				);
			}
		}
		return { destination: resolvedDestination, source: resolvedSource };
	}
}

export async function createAuthorizedRootRegistry(
	inputs: AuthorizedRootGrantInput[]
): Promise<AuthorizedRootRegistry> {
	const ids = new Set<string>();
	const canonicalPaths: string[] = [];
	const grants: AuthorizedRootGrant[] = [];
	for (const input of inputs) {
		if (ids.has(input.id)) throw configError(`Media root ID duplicado: ${input.id}.`);
		ids.add(input.id);
		assertLocalAbsolutePath(input.path);
		let canonicalPath: string;
		try {
			canonicalPath = await realpath(input.path);
			if (!(await stat(canonicalPath)).isDirectory()) throw new Error('not-directory');
			assertLocalAbsolutePath(canonicalPath);
		} catch (error) {
			if (error instanceof RootAuthorizationError) throw error;
			throw configError(`El media root ${input.id} no existe o no es un directorio local.`);
		}
		const comparablePath = normalizeForComparison(canonicalPath);
		if (
			canonicalPaths.some(
				(existingPath) => isContained(existingPath, comparablePath) || isContained(comparablePath, existingPath)
			)
		) {
			throw configError(`El media root ${input.id} se superpone con otro root autorizado.`);
		}
		canonicalPaths.push(comparablePath);
		grants.push({
			allowCrossRoot: input.allowCrossRoot === true,
			id: input.id,
			label: input.label?.trim() || input.id,
			permissions: new Set(input.permissions),
			realPath: canonicalPath,
		});
	}
	return new AuthorizedRootRegistry(grants);
}

export async function createAuthorizedRootRegistryFromEnvironment(
	environment: Record<string, string | undefined> = process.env
): Promise<AuthorizedRootRegistry> {
	return createAuthorizedRootRegistry(parseAuthorizedRootGrants(environment[ROOT_GRANTS_ENV]));
}
