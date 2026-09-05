#!/usr/bin/env bun

import { createHash, randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEST_DATABASE_MARKER, TEST_DATABASE_OWNER } from '../tests/safety/test-database-guard';
import { migrateDatabase } from './db/migrations';
import { seedDeterministicTestFixture } from './db/test-fixture';

type RunIsolatedCommandOptions = {
	command: string[];
	cwd?: string;
	environment?: NodeJS.ProcessEnv;
	testRootPath?: string;
};

type TestRunMarkerState = 'initializing' | 'ready';

type TestRunMarker = {
	databasePath: string;
	owner: typeof TEST_DATABASE_OWNER;
	processId: number;
	supervisorProcessId: number;
	schemaVersion: number | string;
	startedAt: string;
	cleanupNonce: string;
	state: TestRunMarkerState;
	childProcessId?: number;
};

type OwnerLiveness = 'alive' | 'dead' | 'any';

type TestRunVerificationOptions = {
	testRootPath: string;
	runDirectory: string;
	recordedRunDirectory?: string;
	expectedCleanupNonce?: string;
	expectedOwnerProcessId?: number;
	expectedSupervisorProcessId?: number;
	requiredOwnerLiveness: OwnerLiveness;
	requiredChildLiveness?: OwnerLiveness;
	requiredSupervisorLiveness?: OwnerLiveness;
	minimumAgeMs?: number;
	allowInitializing?: boolean;
};

type VerifiedTestRun = {
	marker: TestRunMarker;
	databasePath: string;
	runDirectory: string;
	testRoot: string;
};

type CleanupResult = {
	removed: boolean;
	restored: boolean;
	workerDatabaseCount: number;
};

type CleanupIdentityInterlock = (directory: string) => Promise<void>;

type TestRunSupervisorConfig = {
	command: string[];
	cleanupNonce: string;
	cwd: string;
	ownerProcessId: number;
	testRootPath: string;
};

type NativeTreeStatus = {
	childProcessId: number;
	error?: string;
	exitCode?: number;
	state: 'ready' | 'completed' | 'error';
};

export const ORPHANED_TEST_RUN_MINIMUM_AGE_MS = 5 * 60 * 1000;

const SUPERVISOR_ARGUMENT = '--isolated-test-supervisor';
const QUARANTINE_PREFIX = '.test-run-quarantine-';
const PROCESS_TREE_POLL_INTERVAL_MS = 25;
const CHILD_TERMINATION_TIMEOUT_MS = 2_000;
const NATIVE_TREE_COMPLETION_TIMEOUT_MS = 15_000;
const NATIVE_HELPER_LOCK_TIMEOUT_MS = 30_000;
const NATIVE_HELPER_STALE_LOCK_MS = 2 * 60 * 1000;
const NATIVE_HELPER_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const NATIVE_HELPER_CACHE_VERSION = 'v2';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SCRIPTS_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIRECTORY = resolve(SCRIPTS_DIRECTORY, '..');
const NATIVE_HELPER_CACHE_DIRECTORY = resolve(WORKSPACE_DIRECTORY, '.scratch', 'tooling');
const WINDOWS_JOB_COMPILER_PATH = resolve(SCRIPTS_DIRECTORY, 'windows-test-job.ps1');
const WINDOWS_JOB_SOURCE_PATH = resolve(SCRIPTS_DIRECTORY, 'windows-test-job.cs');
const POSIX_TREE_SOURCE_PATH = resolve(SCRIPTS_DIRECTORY, 'posix-test-tree.c');
let cleanupIdentityInterlock: CleanupIdentityInterlock | undefined;

export function setCleanupIdentityInterlockForTests(interlock?: CleanupIdentityInterlock): void {
	cleanupIdentityInterlock = interlock;
}

const normalizePath = (value: string): string => {
	const resolvedValue = resolve(value).replace(/^\\\\\?\\/, '');
	return process.platform === 'win32' ? resolvedValue.toLowerCase() : resolvedValue;
};

const pathsMatch = (left: string, right: string): boolean => normalizePath(left) === normalizePath(right);

const isPathInside = (parent: string, child: string): boolean => {
	const childRelativePath = relative(parent, child);
	return childRelativePath !== '' && !childRelativePath.startsWith('..') && !isAbsolute(childRelativePath);
};

const getErrorCode = (error: unknown): string | undefined =>
	typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
		? error.code
		: undefined;

const delay = (milliseconds: number): Promise<void> =>
	new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

type NativeHelperKind = 'posix-test-tree' | 'windows-test-job';

const sha256File = async (path: string): Promise<string> =>
	createHash('sha256')
		.update(await readFile(path))
		.digest('hex');

async function ensureNativeHelperCacheDirectory(): Promise<void> {
	await mkdir(NATIVE_HELPER_CACHE_DIRECTORY, { recursive: true });
	const cacheStat = await lstat(NATIVE_HELPER_CACHE_DIRECTORY);
	if (!cacheStat.isDirectory() || cacheStat.isSymbolicLink()) {
		throw new Error(`El caché de helpers debe ser un directorio físico: ${NATIVE_HELPER_CACHE_DIRECTORY}`);
	}
	const physicalCachePath = await realpath(NATIVE_HELPER_CACHE_DIRECTORY);
	if (!pathsMatch(physicalCachePath, NATIVE_HELPER_CACHE_DIRECTORY)) {
		throw new Error(`El caché de helpers no puede atravesar un symlink o junction: ${NATIVE_HELPER_CACHE_DIRECTORY}`);
	}
}

async function isValidCachedNativeHelper(executablePath: string, integrityPath: string): Promise<boolean> {
	try {
		const [executableStat, integrityStat, expectedHash] = await Promise.all([
			lstat(executablePath),
			lstat(integrityPath),
			readFile(integrityPath, 'utf8'),
		]);
		if (
			!executableStat.isFile() ||
			executableStat.isSymbolicLink() ||
			!integrityStat.isFile() ||
			integrityStat.isSymbolicLink() ||
			!/^[0-9a-f]{64}$/u.test(expectedHash.trim())
		) {
			return false;
		}
		return (await sha256File(executablePath)) === expectedHash.trim();
	} catch {
		return false;
	}
}

async function quarantineStaleNativeHelperLock(lockPath: string): Promise<boolean> {
	try {
		const lockStat = await lstat(lockPath);
		if (
			!lockStat.isDirectory() ||
			lockStat.isSymbolicLink() ||
			Date.now() - lockStat.mtimeMs < NATIVE_HELPER_STALE_LOCK_MS
		) {
			return false;
		}
		try {
			const owner = JSON.parse(await readFile(resolve(lockPath, 'owner.json'), 'utf8')) as {
				processId?: unknown;
			};
			if (isPositiveProcessId(owner.processId) && isProcessAlive(owner.processId)) {
				return false;
			}
		} catch {
			// Un lock viejo sin dueño válido se puede retirar.
		}

		const staleLockPath = resolve(NATIVE_HELPER_CACHE_DIRECTORY, `${basename(lockPath)}.stale-${randomUUID()}`);
		if (!isPathInside(NATIVE_HELPER_CACHE_DIRECTORY, staleLockPath)) {
			return false;
		}
		await rename(lockPath, staleLockPath);
		await rm(staleLockPath, { force: true, recursive: true });
		return true;
	} catch {
		return false;
	}
}

async function acquireNativeHelperLock(
	lockPath: string,
	executablePath: string,
	integrityPath: string
): Promise<boolean> {
	const deadline = Date.now() + NATIVE_HELPER_LOCK_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (await isValidCachedNativeHelper(executablePath, integrityPath)) {
			return false;
		}
		try {
			await mkdir(lockPath);
			await writeFile(
				resolve(lockPath, 'owner.json'),
				JSON.stringify({ processId: process.pid, startedAt: new Date().toISOString() }),
				'utf8'
			);
			return true;
		} catch (error) {
			if (getErrorCode(error) !== 'EEXIST') {
				throw error;
			}
			await quarantineStaleNativeHelperLock(lockPath);
			await delay(50);
		}
	}
	throw new Error(`No se pudo obtener el lock del helper nativo: ${lockPath}`);
}

async function compileNativeHelper(kind: NativeHelperKind, sourcePath: string, outputPath: string): Promise<void> {
	const compilation =
		kind === 'windows-test-job'
			? Bun.spawn(
					[
						process.env.SystemRoot
							? resolve(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
							: 'powershell.exe',
						'-NoLogo',
						'-NoProfile',
						'-NonInteractive',
						'-ExecutionPolicy',
						'Bypass',
						'-File',
						WINDOWS_JOB_COMPILER_PATH,
						'-SourcePath',
						sourcePath,
						'-OutputPath',
						outputPath,
					],
					{ cwd: WORKSPACE_DIRECTORY, stderr: 'pipe', stdin: 'ignore', stdout: 'ignore', windowsHide: true }
				)
			: Bun.spawn(['cc', '-O2', '-std=c11', '-Wall', '-Wextra', sourcePath, '-o', outputPath], {
					cwd: WORKSPACE_DIRECTORY,
					stderr: 'pipe',
					stdin: 'ignore',
					stdout: 'ignore',
				});
	const [exitCode, errorOutput] = await Promise.all([compilation.exited, new Response(compilation.stderr).text()]);
	if (exitCode !== 0) {
		throw new Error(`No se pudo compilar ${kind} (exit ${exitCode}): ${errorOutput.trim()}`);
	}
}

async function cleanupOldNativeHelpers(kind: NativeHelperKind, currentExecutableName: string): Promise<void> {
	let entries: Awaited<ReturnType<typeof readdir>>;
	try {
		entries = await readdir(NATIVE_HELPER_CACHE_DIRECTORY, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		if (
			!entry.name.startsWith(`${kind}-`) ||
			entry.name === currentExecutableName ||
			entry.name === `${currentExecutableName}.sha256` ||
			entry.name === `${currentExecutableName}.lock`
		) {
			continue;
		}
		const entryPath = resolve(NATIVE_HELPER_CACHE_DIRECTORY, entry.name);
		try {
			const entryStat = await lstat(entryPath);
			if (entryStat.isSymbolicLink() || Date.now() - entryStat.mtimeMs < NATIVE_HELPER_RETENTION_MS) {
				continue;
			}
			if (entryStat.isDirectory() && entry.name.endsWith('.lock')) {
				await quarantineStaleNativeHelperLock(entryPath);
			} else if (entryStat.isFile()) {
				await rm(entryPath, { force: true });
			}
		} catch {
			// El caché sigue siendo válido aunque no pueda retirar una entrada vieja.
		}
	}
}

async function prepareNativeHelper(kind: NativeHelperKind): Promise<string> {
	await ensureNativeHelperCacheDirectory();
	const sourcePath = kind === 'windows-test-job' ? WINDOWS_JOB_SOURCE_PATH : POSIX_TREE_SOURCE_PATH;
	for (let attempt = 0; attempt < 2; attempt += 1) {
		const sourceHash = await sha256File(sourcePath);
		const extension = kind === 'windows-test-job' ? '.exe' : '';
		const executableName = `${kind}-${NATIVE_HELPER_CACHE_VERSION}-${sourceHash}${extension}`;
		const executablePath = resolve(NATIVE_HELPER_CACHE_DIRECTORY, executableName);
		const integrityPath = `${executablePath}.sha256`;
		const lockPath = `${executablePath}.lock`;
		if (await isValidCachedNativeHelper(executablePath, integrityPath)) {
			await cleanupOldNativeHelpers(kind, executableName);
			return executablePath;
		}

		const ownsLock = await acquireNativeHelperLock(lockPath, executablePath, integrityPath);
		if (!ownsLock) {
			continue;
		}
		const temporaryExecutablePath =
			kind === 'windows-test-job'
				? `${executablePath}.tmp-${process.pid}-${randomUUID()}.exe`
				: `${executablePath}.tmp-${process.pid}-${randomUUID()}`;
		const temporaryIntegrityPath = `${temporaryExecutablePath}.sha256`;
		try {
			await rm(executablePath, { force: true });
			await rm(integrityPath, { force: true });
			await compileNativeHelper(kind, sourcePath, temporaryExecutablePath);
			if (kind === 'posix-test-tree') {
				await chmod(temporaryExecutablePath, 0o755);
			}
			if ((await sha256File(sourcePath)) !== sourceHash) {
				continue;
			}
			await writeFile(temporaryIntegrityPath, await sha256File(temporaryExecutablePath), 'utf8');
			await rename(temporaryExecutablePath, executablePath);
			await rename(temporaryIntegrityPath, integrityPath);
			if (!(await isValidCachedNativeHelper(executablePath, integrityPath))) {
				throw new Error(`La integridad del helper compilado no coincide: ${executablePath}`);
			}
			await cleanupOldNativeHelpers(kind, executableName);
			return executablePath;
		} finally {
			await rm(temporaryExecutablePath, { force: true });
			await rm(temporaryIntegrityPath, { force: true });
			await rm(lockPath, { force: true, recursive: true });
		}
	}

	throw new Error(`La fuente de ${kind} cambió durante la compilación.`);
}

async function readNativeTreeStatus(statusPath: string, expectedNonce: string): Promise<NativeTreeStatus | undefined> {
	let content: string;
	try {
		content = await readFile(statusPath, 'utf8');
	} catch (error) {
		if (getErrorCode(error) === 'ENOENT') {
			return undefined;
		}
		throw error;
	}

	const [state, nonce, rawProcessId, payload = '', completionProof = ''] = content.split(/\r?\n/u);
	const childProcessId = Number(rawProcessId);
	if (
		nonce !== expectedNonce ||
		!Number.isSafeInteger(childProcessId) ||
		childProcessId < 0 ||
		!['ready', 'completed', 'error'].includes(state)
	) {
		return undefined;
	}

	if (state === 'ready' && childProcessId > 0) {
		return { childProcessId, state };
	}
	if (state === 'completed' && childProcessId > 0 && completionProof === 'tree-empty') {
		const exitCode = Number(payload);
		return Number.isSafeInteger(exitCode) ? { childProcessId, exitCode, state } : undefined;
	}
	if (state === 'error') {
		let decodedError = 'El helper de Job Object falló sin detalle legible.';
		try {
			decodedError = Buffer.from(payload, 'base64').toString('utf8');
		} catch {
			// Conserva el mensaje seguro por defecto.
		}
		return { childProcessId, error: decodedError, state };
	}

	return undefined;
}

async function waitForNativeTreeInitialStatus(
	helper: ReturnType<typeof Bun.spawn>,
	statusPath: string,
	nonce: string,
	ownerDisconnected: Promise<void>
): Promise<{ kind: 'owner' } | { kind: 'status'; status: NativeTreeStatus }> {
	const helperExited = helper.exited.then((exitCode) => ({ exitCode, kind: 'helper' as const }));
	const ownerExited = ownerDisconnected.then(() => ({ kind: 'owner' as const }));

	while (true) {
		const status = await readNativeTreeStatus(statusPath, nonce);
		if (status) {
			return { kind: 'status', status };
		}

		const event = await Promise.race([
			helperExited,
			ownerExited,
			delay(PROCESS_TREE_POLL_INTERVAL_MS).then(() => ({ kind: 'poll' as const })),
		]);
		if (event.kind === 'owner') {
			return event;
		}
		if (event.kind === 'helper') {
			const finalStatus = await readNativeTreeStatus(statusPath, nonce);
			if (finalStatus) {
				return { kind: 'status', status: finalStatus };
			}
			throw new Error(`El helper de Job Object terminó con código ${event.exitCode} sin emitir estado.`);
		}
	}
}

async function waitForNativeHelperExit(
	helper: ReturnType<typeof Bun.spawn>,
	timeoutMs: number
): Promise<number | undefined> {
	return await new Promise((resolveExit) => {
		const timeout = setTimeout(() => resolveExit(undefined), timeoutMs);
		helper.exited.then((exitCode) => {
			clearTimeout(timeout);
			resolveExit(exitCode);
		});
	});
}

async function confirmNativeTreeCompletion(
	helper: ReturnType<typeof Bun.spawn>,
	statusPath: string,
	nonce: string,
	expectedChildProcessId?: number
): Promise<{ exitCode: number; stopped: boolean }> {
	const helperExitCode = await waitForNativeHelperExit(helper, NATIVE_TREE_COMPLETION_TIMEOUT_MS);
	if (helperExitCode === undefined) {
		console.error(`El helper de Job Object ${helper.pid} no terminó dentro del plazo.`);
		return { exitCode: 1, stopped: false };
	}

	const status = await readNativeTreeStatus(statusPath, nonce);
	if (status?.state === 'error') {
		console.error(`El helper de Job Object falló: ${status.error}`);
		return { exitCode: helperExitCode, stopped: false };
	}
	if (
		status?.state !== 'completed' ||
		status.exitCode === undefined ||
		(expectedChildProcessId !== undefined && status.childProcessId !== expectedChildProcessId) ||
		helperExitCode !== status.exitCode
	) {
		console.error(`El helper de Job Object ${helper.pid} no confirmó el cierre completo del Job.`);
		return { exitCode: helperExitCode, stopped: false };
	}

	return { exitCode: status.exitCode, stopped: true };
}

const parseIsoTimestamp = (value: string): number | undefined => {
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value ? timestamp : undefined;
};

const hasSchemaVersion = (value: unknown): value is number | string =>
	(typeof value === 'string' && value.trim().length > 0) || (typeof value === 'number' && Number.isFinite(value));

const isTestRunMarkerState = (value: unknown): value is TestRunMarkerState =>
	value === 'initializing' || value === 'ready';

const isPositiveProcessId = (value: unknown): value is number =>
	typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const isTestRunMarker = (value: unknown): value is TestRunMarker => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const marker = value as Record<string, unknown>;
	return (
		typeof marker.databasePath === 'string' &&
		marker.databasePath.length > 0 &&
		isAbsolute(marker.databasePath) &&
		marker.owner === TEST_DATABASE_OWNER &&
		isPositiveProcessId(marker.processId) &&
		isPositiveProcessId(marker.supervisorProcessId) &&
		hasSchemaVersion(marker.schemaVersion) &&
		typeof marker.startedAt === 'string' &&
		parseIsoTimestamp(marker.startedAt) !== undefined &&
		typeof marker.cleanupNonce === 'string' &&
		marker.cleanupNonce.length >= 16 &&
		isTestRunMarkerState(marker.state) &&
		((marker.state === 'initializing' && marker.childProcessId === undefined) ||
			(marker.state === 'ready' && isPositiveProcessId(marker.childProcessId)))
	);
};

const isProcessAlive = (processId: number): boolean => {
	try {
		process.kill(processId, 0);
		return true;
	} catch (error) {
		return getErrorCode(error) !== 'ESRCH';
	}
};

type IpcProcess = NodeJS.Process & {
	connected?: boolean;
	disconnect?: () => void;
};

type OwnerChannel = {
	disconnected: Promise<void>;
	isConnected: () => boolean;
};

function createOwnerChannel(): OwnerChannel {
	const ipcProcess = process as IpcProcess;
	let connected = ipcProcess.connected === true;
	let disconnectedOnce = false;
	let markDisconnected: () => void = () => {};
	const disconnected = new Promise<void>((resolveDisconnected) => {
		markDisconnected = () => {
			if (disconnectedOnce) {
				return;
			}
			disconnectedOnce = true;
			connected = false;
			resolveDisconnected();
		};
	});
	process.once('disconnect', markDisconnected);
	if (!connected) {
		queueMicrotask(markDisconnected);
	}

	return {
		disconnected,
		isConnected: () => connected && ipcProcess.connected !== false,
	};
}

function disconnectOwnerChannel(): void {
	const ipcProcess = process as IpcProcess;
	if (ipcProcess.connected !== true || typeof ipcProcess.disconnect !== 'function') {
		return;
	}
	try {
		ipcProcess.disconnect();
	} catch {
		// El wrapper ya cerró el canal.
	}
}

async function findExistingPathAncestor(path: string): Promise<string> {
	let candidate = resolve(path);
	while (true) {
		try {
			await lstat(candidate);
			return candidate;
		} catch (error) {
			if (getErrorCode(error) !== 'ENOENT') {
				throw error;
			}

			const parent = resolve(candidate, '..');
			if (pathsMatch(parent, candidate)) {
				throw new Error(`No se encontró un ancestro existente para el root temporal: ${path}`);
			}
			candidate = parent;
		}
	}
}

async function resolveCanonicalTestRoot(testRootPath: string, createIfMissing: boolean): Promise<string> {
	const requestedRoot = resolve(testRootPath);
	if (createIfMissing) {
		const existingAncestor = await findExistingPathAncestor(requestedRoot);
		const existingAncestorStat = await lstat(existingAncestor);
		if (!existingAncestorStat.isDirectory() || existingAncestorStat.isSymbolicLink()) {
			throw new Error(`El root temporal debe ser un directorio físico: ${requestedRoot}`);
		}

		const physicalExistingAncestor = await realpath(existingAncestor);
		if (!pathsMatch(existingAncestor, physicalExistingAncestor)) {
			throw new Error(`El root temporal no puede atravesar un symlink o junction: ${requestedRoot}`);
		}
		await mkdir(requestedRoot, { recursive: true });
	}

	const rootStat = await lstat(requestedRoot);
	if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
		throw new Error(`El root temporal debe ser un directorio físico: ${requestedRoot}`);
	}

	const canonicalRoot = await realpath(requestedRoot);
	if (!pathsMatch(requestedRoot, canonicalRoot)) {
		throw new Error(`El root temporal no puede atravesar un symlink o junction: ${requestedRoot}`);
	}

	return canonicalRoot;
}

async function writeTestRunMarker(markerPath: string, marker: TestRunMarker): Promise<void> {
	await writeFile(markerPath, JSON.stringify(marker, null, 2), 'utf8');
}

async function verifyTestRun(options: TestRunVerificationOptions): Promise<VerifiedTestRun | undefined> {
	try {
		const testRoot = await resolveCanonicalTestRoot(options.testRootPath, false);
		const runDirectory = resolve(options.runDirectory);
		const recordedRunDirectory = resolve(options.recordedRunDirectory ?? runDirectory);
		if (!isPathInside(testRoot, runDirectory) || !isPathInside(testRoot, recordedRunDirectory)) {
			return undefined;
		}

		const runStat = await lstat(runDirectory);
		if (!runStat.isDirectory() || runStat.isSymbolicLink()) {
			return undefined;
		}
		const physicalRunDirectory = await realpath(runDirectory);
		if (!isPathInside(testRoot, physicalRunDirectory)) {
			return undefined;
		}

		const markerPath = resolve(runDirectory, TEST_DATABASE_MARKER);
		if (!isPathInside(runDirectory, markerPath)) {
			return undefined;
		}
		const markerStat = await lstat(markerPath);
		if (!markerStat.isFile() || markerStat.isSymbolicLink()) {
			return undefined;
		}

		const marker = JSON.parse(await readFile(markerPath, 'utf8'));
		if (!isTestRunMarker(marker)) {
			return undefined;
		}
		if (options.expectedCleanupNonce !== undefined && marker.cleanupNonce !== options.expectedCleanupNonce) {
			return undefined;
		}
		if (options.expectedOwnerProcessId !== undefined && marker.processId !== options.expectedOwnerProcessId) {
			return undefined;
		}
		if (
			options.expectedSupervisorProcessId !== undefined &&
			marker.supervisorProcessId !== options.expectedSupervisorProcessId
		) {
			return undefined;
		}

		const ownerIsAlive = isProcessAlive(marker.processId);
		if (
			(options.requiredOwnerLiveness === 'alive' && !ownerIsAlive) ||
			(options.requiredOwnerLiveness === 'dead' && ownerIsAlive)
		) {
			return undefined;
		}
		const supervisorIsAlive = isProcessAlive(marker.supervisorProcessId);
		if (
			(options.requiredSupervisorLiveness === 'alive' && !supervisorIsAlive) ||
			(options.requiredSupervisorLiveness === 'dead' && supervisorIsAlive)
		) {
			return undefined;
		}
		if (marker.childProcessId !== undefined) {
			const childIsAlive = isProcessAlive(marker.childProcessId);
			if (
				(options.requiredChildLiveness === 'alive' && !childIsAlive) ||
				(options.requiredChildLiveness === 'dead' && childIsAlive)
			) {
				return undefined;
			}
		}

		if (
			options.minimumAgeMs !== undefined &&
			Date.now() - (parseIsoTimestamp(marker.startedAt) ?? Number.POSITIVE_INFINITY) < options.minimumAgeMs
		) {
			return undefined;
		}

		if (marker.state === 'initializing' && !options.allowInitializing) {
			return undefined;
		}

		const recordedDatabasePath = resolve(marker.databasePath);
		const expectedRecordedDatabasePath = resolve(recordedRunDirectory, 'db.sqlite');
		if (
			!pathsMatch(recordedDatabasePath, expectedRecordedDatabasePath) ||
			!isPathInside(recordedRunDirectory, recordedDatabasePath)
		) {
			return undefined;
		}

		const databasePath = resolve(runDirectory, 'db.sqlite');
		try {
			const databaseStat = await lstat(databasePath);
			if (!databaseStat.isFile() || databaseStat.isSymbolicLink()) {
				return undefined;
			}
			const physicalDatabasePath = await realpath(databasePath);
			if (!isPathInside(physicalRunDirectory, physicalDatabasePath)) {
				return undefined;
			}
		} catch (error) {
			if (getErrorCode(error) !== 'ENOENT' || marker.state !== 'initializing' || !options.allowInitializing) {
				return undefined;
			}
		}

		return { databasePath, marker, runDirectory, testRoot };
	} catch {
		return undefined;
	}
}

async function createQuarantineDirectory(testRoot: string, runDirectory: string): Promise<string | undefined> {
	for (let attempt = 0; attempt < 4; attempt += 1) {
		const quarantineDirectory = resolve(testRoot, `${QUARANTINE_PREFIX}${basename(runDirectory)}-${randomUUID()}`);
		if (!isPathInside(testRoot, quarantineDirectory)) {
			return undefined;
		}

		try {
			await rename(runDirectory, quarantineDirectory);
			return quarantineDirectory;
		} catch (error) {
			if (getErrorCode(error) !== 'EEXIST' && getErrorCode(error) !== 'ENOTEMPTY') {
				return undefined;
			}
		}
	}

	return undefined;
}

async function restoreQuarantinedRun(
	testRoot: string,
	quarantineDirectory: string,
	runDirectory: string
): Promise<boolean> {
	try {
		if (!isPathInside(testRoot, quarantineDirectory) || !isPathInside(testRoot, runDirectory)) {
			return false;
		}
		const quarantineStat = await lstat(quarantineDirectory);
		if (!quarantineStat.isDirectory() || quarantineStat.isSymbolicLink()) {
			return false;
		}
		const physicalQuarantineDirectory = await realpath(quarantineDirectory);
		if (!isPathInside(testRoot, physicalQuarantineDirectory)) {
			return false;
		}

		try {
			await lstat(runDirectory);
			return false;
		} catch (error) {
			if (getErrorCode(error) !== 'ENOENT') {
				return false;
			}
		}

		await rename(quarantineDirectory, runDirectory);
		return true;
	} catch {
		return false;
	}
}

async function countWorkerDatabases(runDirectory: string): Promise<number> {
	try {
		return (await readdir(runDirectory, { withFileTypes: true })).filter(
			(entry) => entry.isDirectory() && entry.name.startsWith('worker-')
		).length;
	} catch {
		return 0;
	}
}

async function deleteOwnedDirectoryWithStableIdentity(testRoot: string, directory: string): Promise<boolean> {
	if (process.platform !== 'win32' && process.platform !== 'linux') {
		console.error(`Borrado fail-closed sin helper por handle/dirfd para ${process.platform}: ${directory}`);
		return false;
	}

	const handshakeNonce = randomUUID();
	const readyPath = resolve(testRoot, `.test-delete-ready-${handshakeNonce}`);
	const controlPath = resolve(testRoot, `.test-delete-control-${handshakeNonce}`);
	let deleter: ReturnType<typeof Bun.spawn> | undefined;
	try {
		const helperKind: NativeHelperKind = process.platform === 'win32' ? 'windows-test-job' : 'posix-test-tree';
		const helperExecutablePath = await prepareNativeHelper(helperKind);
		if (!isPathInside(testRoot, readyPath) || !isPathInside(testRoot, controlPath)) {
			return false;
		}
		deleter = Bun.spawn([helperExecutablePath, '--delete-tree', directory, readyPath, controlPath], {
			cwd: testRoot,
			detached: process.platform !== 'win32',
			stderr: 'inherit',
			stdin: 'ignore',
			stdout: 'ignore',
			windowsHide: true,
		});
		const readyDeadline = Date.now() + 30_000;
		let locked = false;
		while (Date.now() < readyDeadline && deleter.exitCode === null) {
			try {
				locked = (await readFile(readyPath, 'utf8')) === 'locked';
			} catch {
				locked = false;
			}
			if (locked) {
				break;
			}
			await delay(PROCESS_TREE_POLL_INTERVAL_MS);
		}
		if (!locked) {
			if (process.platform === 'win32') {
				await stopWindowsHelperAsFallback(deleter);
			} else {
				await terminatePosixProcessTree(deleter);
			}
			console.error(`El deleter nativo no confirmó el lock del directorio: ${directory}`);
			return false;
		}

		let interlockPassed = true;
		try {
			await cleanupIdentityInterlock?.(directory);
		} catch (error) {
			interlockPassed = false;
			console.error(`Borrado bloqueado por el interlock de identidad: ${String(error)}`);
		}
		await writeFile(controlPath, interlockPassed ? 'delete' : 'abort', 'utf8');
		const deleterExitCode = await waitForNativeHelperExit(deleter, 30_000);
		if (deleterExitCode === undefined) {
			if (process.platform === 'win32') {
				await stopWindowsHelperAsFallback(deleter);
			} else {
				await terminatePosixProcessTree(deleter);
			}
			return false;
		}
		if (!interlockPassed || deleterExitCode !== 0) {
			return false;
		}
		try {
			await lstat(directory);
			return false;
		} catch (error) {
			return getErrorCode(error) === 'ENOENT';
		}
	} catch (error) {
		console.error(`Directorio temporal preservado tras fallar el borrado por handle: ${directory}. ${String(error)}`);
		return false;
	} finally {
		await rm(readyPath, { force: true });
		await rm(controlPath, { force: true });
	}
}

async function cleanupVerifiedTestRun(options: TestRunVerificationOptions): Promise<CleanupResult> {
	const beforeMove = await verifyTestRun(options);
	if (!beforeMove) {
		return { removed: false, restored: false, workerDatabaseCount: 0 };
	}

	const quarantineDirectory = await createQuarantineDirectory(beforeMove.testRoot, beforeMove.runDirectory);
	if (!quarantineDirectory) {
		return { removed: false, restored: false, workerDatabaseCount: 0 };
	}

	const afterMove = await verifyTestRun({
		...options,
		runDirectory: quarantineDirectory,
		recordedRunDirectory: beforeMove.runDirectory,
	});
	if (!afterMove) {
		const restored = await restoreQuarantinedRun(beforeMove.testRoot, quarantineDirectory, beforeMove.runDirectory);
		if (!restored) {
			console.error(`Run en cuarentena conservado tras una validación fallida: ${quarantineDirectory}`);
		}
		return { removed: false, restored, workerDatabaseCount: 0 };
	}

	const workerDatabaseCount = await countWorkerDatabases(quarantineDirectory);
	if (await deleteOwnedDirectoryWithStableIdentity(beforeMove.testRoot, quarantineDirectory)) {
		return { removed: true, restored: false, workerDatabaseCount };
	}
	return { removed: false, restored: false, workerDatabaseCount: 0 };
}

async function inferRecordedRunDirectoryFromQuarantine(
	testRoot: string,
	quarantineDirectory: string
): Promise<string | undefined> {
	try {
		const quarantineName = basename(quarantineDirectory);
		if (!quarantineName.startsWith(QUARANTINE_PREFIX)) {
			return undefined;
		}

		const markerPath = resolve(quarantineDirectory, TEST_DATABASE_MARKER);
		const markerStat = await lstat(markerPath);
		if (!markerStat.isFile() || markerStat.isSymbolicLink()) {
			return undefined;
		}
		const marker = JSON.parse(await readFile(markerPath, 'utf8'));
		if (!isTestRunMarker(marker) || marker.state !== 'ready') {
			return undefined;
		}

		const recordedRunDirectory = dirname(resolve(marker.databasePath));
		const recordedRunName = basename(recordedRunDirectory);
		if (!recordedRunName.startsWith('run-') || !isPathInside(testRoot, recordedRunDirectory)) {
			return undefined;
		}
		const quarantineNonce = quarantineName.slice(`${QUARANTINE_PREFIX}${recordedRunName}-`.length);
		if (!quarantineName.startsWith(`${QUARANTINE_PREFIX}${recordedRunName}-`) || !UUID_PATTERN.test(quarantineNonce)) {
			return undefined;
		}

		try {
			await lstat(recordedRunDirectory);
			return undefined;
		} catch (error) {
			if (getErrorCode(error) !== 'ENOENT') {
				return undefined;
			}
		}

		return recordedRunDirectory;
	} catch {
		return undefined;
	}
}

async function cleanupInterruptedQuarantine(testRoot: string, quarantineDirectory: string): Promise<boolean> {
	const recordedRunDirectory = await inferRecordedRunDirectoryFromQuarantine(testRoot, quarantineDirectory);
	if (!recordedRunDirectory) {
		return false;
	}

	const verified = await verifyTestRun({
		testRootPath: testRoot,
		runDirectory: quarantineDirectory,
		recordedRunDirectory,
		requiredOwnerLiveness: 'dead',
		requiredSupervisorLiveness: 'dead',
		requiredChildLiveness: 'dead',
	});
	if (!verified) {
		return false;
	}

	try {
		await lstat(recordedRunDirectory);
		return false;
	} catch (error) {
		if (getErrorCode(error) !== 'ENOENT') {
			return false;
		}
	}

	return await deleteOwnedDirectoryWithStableIdentity(testRoot, quarantineDirectory);
}

export async function cleanupOrphanedTestRuns(testRootPath: string): Promise<string[]> {
	let testRoot: string;
	try {
		testRoot = await resolveCanonicalTestRoot(testRootPath, false);
	} catch (error) {
		console.warn(`No se pudo inspeccionar el root temporal de tests: ${String(error)}`);
		return [];
	}

	let entries: Awaited<ReturnType<typeof readdir>>;
	try {
		entries = await readdir(testRoot, { withFileTypes: true });
	} catch (error) {
		console.warn(`No se pudo listar el root temporal de tests: ${String(error)}`);
		return [];
	}

	const removedRuns: string[] = [];
	for (const entry of entries) {
		if (!entry.isDirectory() || entry.isSymbolicLink() || !entry.name.startsWith(QUARANTINE_PREFIX)) {
			continue;
		}

		const quarantineDirectory = resolve(testRoot, entry.name);
		if (!(await cleanupInterruptedQuarantine(testRoot, quarantineDirectory))) {
			continue;
		}

		removedRuns.push(quarantineDirectory);
		console.log(`🧹 Cuarentena de tests interrumpida eliminada: ${quarantineDirectory}`);
	}

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.isSymbolicLink() || !entry.name.startsWith('run-')) {
			continue;
		}

		const runDirectory = resolve(testRoot, entry.name);
		const cleanupResult = await cleanupVerifiedTestRun({
			testRootPath: testRoot,
			runDirectory,
			requiredOwnerLiveness: 'dead',
			minimumAgeMs: ORPHANED_TEST_RUN_MINIMUM_AGE_MS,
			requiredSupervisorLiveness: 'dead',
			requiredChildLiveness: 'dead',
		});
		if (!cleanupResult.removed) {
			continue;
		}

		removedRuns.push(runDirectory);
		console.log(`🧹 Run de tests huérfano eliminado: ${runDirectory}`);
	}

	return removedRuns;
}

async function waitForChildExit(child: ReturnType<typeof Bun.spawn>): Promise<boolean> {
	return await new Promise((resolveExit) => {
		const timeout = setTimeout(() => resolveExit(false), CHILD_TERMINATION_TIMEOUT_MS);
		child.exited.then(() => {
			clearTimeout(timeout);
			resolveExit(true);
		});
	});
}

const isProcessGroupAlive = (processGroupId: number): boolean => {
	try {
		process.kill(-processGroupId, 0);
		return true;
	} catch (error) {
		return getErrorCode(error) !== 'ESRCH';
	}
};

async function waitForProcessGroupExit(processGroupId: number): Promise<boolean> {
	const deadline = Date.now() + CHILD_TERMINATION_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (!isProcessGroupAlive(processGroupId)) {
			return true;
		}
		await delay(PROCESS_TREE_POLL_INTERVAL_MS);
	}
	return !isProcessGroupAlive(processGroupId);
}

async function stopWindowsHelperAsFallback(child: ReturnType<typeof Bun.spawn>): Promise<boolean> {
	if (child.exitCode !== null) {
		console.error(`El helper ${child.pid} terminó sin confirmar que su Job Object quedó vacío.`);
		return false;
	}

	const systemRoot = process.env.SystemRoot ?? process.env.windir ?? 'C:\\Windows';
	const taskkillPath = join(systemRoot, 'System32', 'taskkill.exe');
	let taskkill: ReturnType<typeof Bun.spawn>;
	try {
		taskkill = Bun.spawn([taskkillPath, '/PID', String(child.pid), '/T', '/F'], {
			stderr: 'pipe',
			stdin: 'ignore',
			stdout: 'ignore',
			windowsHide: true,
		});
	} catch (error) {
		console.error(`No se pudo iniciar taskkill.exe para el árbol ${child.pid}: ${String(error)}`);
		return false;
	}

	const [taskkillExitCode, taskkillError] = await Promise.all([taskkill.exited, new Response(taskkill.stderr).text()]);
	if (taskkillExitCode !== 0) {
		console.error(
			`taskkill.exe no confirmó el cierre del árbol ${child.pid} (exit ${taskkillExitCode}): ${taskkillError.trim()}`
		);
		return false;
	}

	if (!(await waitForChildExit(child))) {
		console.error(`taskkill.exe terminó sin confirmar el cierre del helper ${child.pid}.`);
		return false;
	}
	console.error(`El helper ${child.pid} se detuvo como resguardo, pero no confirmó que su Job Object quedó vacío.`);
	return false;
}

async function terminatePosixProcessTree(child: ReturnType<typeof Bun.spawn>): Promise<boolean> {
	if (!isProcessGroupAlive(child.pid)) {
		return child.exitCode !== null || (await waitForChildExit(child));
	}

	try {
		process.kill(-child.pid, 'SIGTERM');
	} catch (error) {
		if (getErrorCode(error) !== 'ESRCH') {
			return false;
		}
	}
	if (await waitForProcessGroupExit(child.pid)) {
		return child.exitCode !== null || (await waitForChildExit(child));
	}

	try {
		process.kill(-child.pid, 'SIGKILL');
	} catch (error) {
		if (getErrorCode(error) !== 'ESRCH') {
			return false;
		}
	}
	return (await waitForProcessGroupExit(child.pid)) && (child.exitCode !== null || (await waitForChildExit(child)));
}

async function stopNativeHelperAsFallback(child: ReturnType<typeof Bun.spawn>): Promise<false> {
	if (process.platform === 'win32') {
		await stopWindowsHelperAsFallback(child);
	} else {
		let subreaperStopped = false;
		try {
			process.kill(child.pid, 'SIGUSR1');
			subreaperStopped = (await waitForNativeHelperExit(child, NATIVE_TREE_COMPLETION_TIMEOUT_MS)) !== undefined;
		} catch (error) {
			if (getErrorCode(error) !== 'ESRCH') {
				console.error(`No se pudo pedir el cierre de emergencia al subreaper POSIX ${child.pid}: ${String(error)}`);
			}
		}
		if (subreaperStopped) {
			console.error(
				`El subreaper POSIX ${child.pid} agotó el árbol como resguardo, pero el recibo llegó fuera del flujo confirmado.`
			);
		} else {
			const helperGroupStopped = await terminatePosixProcessTree(child);
			console.error(
				helperGroupStopped
					? `El grupo del helper POSIX ${child.pid} se detuvo sin confirmar que el subreaper agotó sus descendientes.`
					: `El fallback no confirmó siquiera el cierre del grupo del helper POSIX ${child.pid}.`
			);
		}
	}

	return false;
}

async function cleanupSupervisorRun(
	testRootPath: string,
	runDirectory: string,
	ownerProcessId: number,
	supervisorProcessId: number,
	cleanupNonce: string
): Promise<CleanupResult> {
	return await cleanupVerifiedTestRun({
		testRootPath,
		runDirectory,
		expectedCleanupNonce: cleanupNonce,
		expectedOwnerProcessId: ownerProcessId,
		expectedSupervisorProcessId: supervisorProcessId,
		requiredOwnerLiveness: 'any',
		requiredSupervisorLiveness: 'alive',
		requiredChildLiveness: 'dead',
		allowInitializing: true,
	});
}

async function runIsolatedTestSupervisor(config: TestRunSupervisorConfig): Promise<number> {
	const supervisorStartedAt = Date.now();
	const debugWindowsJob = (message: string): void => {
		if (process.env.MEDIA_MANAGER_TEST_JOB_DEBUG === '1') {
			console.error(`[isolated-test-supervisor ${Date.now() - supervisorStartedAt}ms] ${message}`);
		}
	};
	const ownerChannel = createOwnerChannel();
	if (!ownerChannel.isConnected()) {
		return 143;
	}

	let testRoot: string;
	try {
		testRoot = await resolveCanonicalTestRoot(config.testRootPath, false);
		if (!pathsMatch(testRoot, config.testRootPath)) {
			throw new Error(`El supervisor recibió un root no canónico: ${config.testRootPath}`);
		}
	} catch (error) {
		console.error(`Supervisor de tests bloqueado: ${String(error)}`);
		return 1;
	}

	if (!ownerChannel.isConnected()) {
		return 143;
	}

	const runDirectory = await mkdtemp(join(testRoot, 'run-'));
	if (!isPathInside(testRoot, runDirectory)) {
		console.error(`Supervisor de tests bloqueado fuera del root autorizado: ${runDirectory}`);
		return 1;
	}

	const databasePath = resolve(runDirectory, 'db.sqlite');
	const markerPath = resolve(runDirectory, TEST_DATABASE_MARKER);
	const startedAt = new Date().toISOString();
	let marker: TestRunMarker = {
		databasePath,
		owner: TEST_DATABASE_OWNER,
		processId: config.ownerProcessId,
		supervisorProcessId: process.pid,
		schemaVersion: 'initializing',
		startedAt,
		cleanupNonce: config.cleanupNonce,
		state: 'initializing',
	};
	let child: ReturnType<typeof Bun.spawn> | undefined;
	let childTreeStopped = true;

	try {
		await writeTestRunMarker(markerPath, marker);
		console.log('🔒 Creando DB de tests descartable desde migraciones versionadas');
		const migrationResult = await migrateDatabase({ databasePath });
		if (!ownerChannel.isConnected()) {
			return 143;
		}

		seedDeterministicTestFixture(databasePath);
		if (!ownerChannel.isConnected()) {
			return 143;
		}

		const schemaVersion = process.env.MEDIA_MANAGER_TEST_SCHEMA_VERSION ?? migrationResult.applied.at(-1) ?? 'current';
		const childEnvironment = {
			...process.env,
			DATABASE_URL: pathToFileURL(databasePath).href,
			DISABLE_FTS5: '1',
			MEDIA_MANAGER_TEST_DB: '1',
			MEDIA_MANAGER_TEST_DB_ROOT: runDirectory,
			MEDIA_MANAGER_TEST_DB_TEMPLATE: databasePath,
			MEDIA_MANAGER_TEST_SCHEMA_VERSION: schemaVersion,
			NODE_ENV: 'test',
		};

		if (process.platform === 'win32' || process.platform === 'linux') {
			debugWindowsJob('preparando helper nativo');
			const helperKind: NativeHelperKind = process.platform === 'win32' ? 'windows-test-job' : 'posix-test-tree';
			let helperExecutablePath: string;
			try {
				helperExecutablePath = await prepareNativeHelper(helperKind);
			} catch (error) {
				childTreeStopped = false;
				throw error;
			}
			if (!ownerChannel.isConnected()) {
				return 143;
			}

			const statusFileName = process.platform === 'win32' ? 'windows-job-status' : 'posix-tree-status';
			const nativeTreeConfigPath = resolve(runDirectory, 'native-tree-config');
			const nativeTreeStatusPath = resolve(runDirectory, statusFileName);
			const nativeTreeStopPath = resolve(runDirectory, 'native-tree-stop');
			const encodeNativeTreeValue = (value: string): string => Buffer.from(value, 'utf8').toString('base64');
			await writeFile(
				nativeTreeConfigPath,
				[
					config.cleanupNonce,
					encodeNativeTreeValue(config.cwd),
					encodeNativeTreeValue(nativeTreeStatusPath),
					encodeNativeTreeValue(nativeTreeStopPath),
					String(config.command.length),
					...config.command.map(encodeNativeTreeValue),
				].join('\n'),
				'utf8'
			);
			childTreeStopped = false;
			child = Bun.spawn([helperExecutablePath, nativeTreeConfigPath], {
				cwd: config.cwd,
				detached: process.platform !== 'win32',
				env: childEnvironment,
				stderr: 'inherit',
				stdin: 'inherit',
				stdout: 'inherit',
				windowsHide: true,
			});
			debugWindowsJob(`helper iniciado (${child.pid})`);
			const initialResult = await waitForNativeTreeInitialStatus(
				child,
				nativeTreeStatusPath,
				config.cleanupNonce,
				ownerChannel.disconnected
			);
			debugWindowsJob(`estado inicial recibido (${initialResult.kind})`);
			if (initialResult.kind === 'owner') {
				await writeFile(nativeTreeStopPath, config.cleanupNonce, 'utf8');
				const completion = await confirmNativeTreeCompletion(child, nativeTreeStatusPath, config.cleanupNonce);
				childTreeStopped = completion.stopped;
				return 143;
			}
			if (initialResult.status.state === 'error') {
				throw new Error(initialResult.status.error);
			}

			const nativeChildProcessId = initialResult.status.childProcessId;
			marker = {
				...marker,
				childProcessId: nativeChildProcessId,
				schemaVersion,
				state: 'ready',
			};
			await writeTestRunMarker(markerPath, marker);

			if (initialResult.status.state === 'completed') {
				const completion = await confirmNativeTreeCompletion(
					child,
					nativeTreeStatusPath,
					config.cleanupNonce,
					nativeChildProcessId
				);
				childTreeStopped = completion.stopped;
				return completion.stopped ? completion.exitCode : 1;
			}

			const result = await Promise.race([
				child.exited.then(() => ({ kind: 'helper' as const })),
				ownerChannel.disconnected.then(() => ({ kind: 'owner' as const })),
			]);
			debugWindowsJob(`evento terminal recibido (${result.kind})`);
			if (result.kind === 'owner') {
				await writeFile(nativeTreeStopPath, config.cleanupNonce, 'utf8');
			}

			const completion = await confirmNativeTreeCompletion(
				child,
				nativeTreeStatusPath,
				config.cleanupNonce,
				nativeChildProcessId
			);
			debugWindowsJob(`confirmación leída (${completion.stopped})`);
			childTreeStopped = completion.stopped;
			return result.kind === 'owner' ? 143 : completion.stopped ? completion.exitCode : 1;
		}

		childTreeStopped = false;
		throw new Error(`No hay contención durable del árbol de tests para ${process.platform}; el run queda preservado.`);
	} catch (error) {
		console.error(`Supervisor de tests falló: ${String(error)}`);
		return 1;
	} finally {
		if (child && !childTreeStopped) {
			childTreeStopped = await stopNativeHelperAsFallback(child);
		}

		if (!childTreeStopped) {
			console.error(`Cleanup bloqueado: el árbol de tests no confirmó su cierre para ${runDirectory}`);
		} else {
			debugWindowsJob('iniciando cleanup');
			const cleanupResult = await cleanupSupervisorRun(
				testRoot,
				runDirectory,
				config.ownerProcessId,
				process.pid,
				config.cleanupNonce
			);
			if (cleanupResult.workerDatabaseCount > 0) {
				console.log(`🧪 DBs SQLite aisladas creadas: ${cleanupResult.workerDatabaseCount}`);
			}
			if (cleanupResult.removed) {
				console.log(`🧹 DB de tests eliminada: ${runDirectory}`);
				debugWindowsJob('cleanup terminado');
			} else {
				console.error(`Cleanup bloqueado para el run de tests: ${runDirectory}`);
			}
		}
	}
}

function encodeSupervisorConfig(config: TestRunSupervisorConfig): string {
	return Buffer.from(JSON.stringify(config), 'utf8').toString('base64url');
}

function decodeSupervisorConfig(value: string | undefined): TestRunSupervisorConfig {
	if (!value) {
		throw new Error('Falta la configuración del supervisor de tests.');
	}

	const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<TestRunSupervisorConfig>;
	if (
		!Array.isArray(parsed.command) ||
		!parsed.command.every((part) => typeof part === 'string') ||
		typeof parsed.cleanupNonce !== 'string' ||
		parsed.cleanupNonce.length < 16 ||
		typeof parsed.cwd !== 'string' ||
		typeof parsed.ownerProcessId !== 'number' ||
		!Number.isSafeInteger(parsed.ownerProcessId) ||
		parsed.ownerProcessId <= 0 ||
		typeof parsed.testRootPath !== 'string'
	) {
		throw new Error('La configuración del supervisor de tests es inválida.');
	}

	return {
		command: parsed.command,
		cleanupNonce: parsed.cleanupNonce,
		cwd: parsed.cwd,
		ownerProcessId: parsed.ownerProcessId,
		testRootPath: parsed.testRootPath,
	};
}

export async function runIsolatedCommand({
	command,
	cwd = process.cwd(),
	environment = process.env,
	testRootPath = environment.MEDIA_MANAGER_TEST_ROOT ?? resolve(cwd, '.scratch', 'test-dbs'),
}: RunIsolatedCommandOptions): Promise<number> {
	if (command.length === 0) {
		throw new Error('Falta el comando de tests a ejecutar.');
	}

	const testRoot = await resolveCanonicalTestRoot(testRootPath, true);
	await cleanupOrphanedTestRuns(testRoot);

	const cleanupNonce = randomUUID();
	const supervisorConfig: TestRunSupervisorConfig = {
		command,
		cleanupNonce,
		cwd,
		ownerProcessId: process.pid,
		testRootPath: testRoot,
	};
	type IpcSubprocess = ReturnType<typeof Bun.spawn> & { disconnect?: () => void };
	let supervisor: IpcSubprocess | undefined;
	let requestedSignalExitCode: number | undefined;
	const requestExitForSignal = (signal: NodeJS.Signals) => {
		const exitCode = signal === 'SIGINT' ? 130 : 143;
		if (requestedSignalExitCode !== undefined) {
			process.exit(exitCode);
		}

		requestedSignalExitCode = exitCode;
		if (!supervisor || typeof supervisor.disconnect !== 'function') {
			process.exit(exitCode);
		}
		try {
			supervisor.disconnect();
		} catch {
			process.exit(exitCode);
		}
	};
	const handleInterrupt = () => requestExitForSignal('SIGINT');
	const handleTermination = () => requestExitForSignal('SIGTERM');
	process.on('SIGINT', handleInterrupt);
	process.on('SIGTERM', handleTermination);

	try {
		supervisor = Bun.spawn(
			[process.execPath, fileURLToPath(import.meta.url), SUPERVISOR_ARGUMENT, encodeSupervisorConfig(supervisorConfig)],
			{
				cwd,
				detached: true,
				env: environment,
				ipc: () => {},
				stderr: 'inherit',
				stdin: 'inherit',
				stdout: 'inherit',
			}
		);
		const supervisorExitCode = await supervisor.exited;
		return requestedSignalExitCode ?? supervisorExitCode;
	} finally {
		process.off('SIGINT', handleInterrupt);
		process.off('SIGTERM', handleTermination);
	}
}

export function isolatedVitestCommand(testArguments: string[]): string[] {
	return [process.execPath, 'x', 'vitest', ...testArguments];
}

if (import.meta.main) {
	if (process.argv[2] === SUPERVISOR_ARGUMENT) {
		try {
			process.exitCode = await runIsolatedTestSupervisor(decodeSupervisorConfig(process.argv[3]));
		} catch (error) {
			console.error(`Supervisor de tests bloqueado: ${String(error)}`);
			process.exitCode = 1;
		} finally {
			disconnectOwnerChannel();
		}
	} else {
		const testArguments = process.argv.slice(2);
		const exitCode = await runIsolatedCommand({
			command: isolatedVitestCommand(testArguments),
		});
		process.exitCode = exitCode;
	}
}
