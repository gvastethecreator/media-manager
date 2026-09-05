import { afterEach, describe, expect, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	cleanupOrphanedTestRuns,
	isolatedVitestCommand,
	ORPHANED_TEST_RUN_MINIMUM_AGE_MS,
	runIsolatedCommand,
	setCleanupIdentityInterlockForTests,
} from './run-tests-isolated';
import { TEST_DATABASE_MARKER, TEST_DATABASE_OWNER } from '../tests/safety/test-database-guard';

const temporaryDirectories: string[] = [];
const workspacePath = resolve(import.meta.dir, '..');
const runnerModuleUrl = pathToFileURL(resolve(import.meta.dir, 'run-tests-isolated.ts')).href;
const SIGNAL_TEST_START_TIMEOUT_MS = 45_000;
const SIGNAL_TEST_CLEANUP_TIMEOUT_MS = 15_000;

function createRunMarker(
	databasePath: string,
	processId: number,
	startedAt: string,
	overrides: Record<string, unknown> = {}
): Record<string, unknown> {
	return {
		databasePath,
		owner: TEST_DATABASE_OWNER,
		processId,
		supervisorProcessId: processId,
		childProcessId: processId,
		schemaVersion: 'test-fixture',
		startedAt,
		cleanupNonce: randomUUID(),
		state: 'ready',
		...overrides,
	};
}

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-runner-'));
	temporaryDirectories.push(directory);
	return directory;
}

async function createWorkspaceTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(workspacePath, 'tests', 'integration', 'isolated-runner-'));
	temporaryDirectories.push(directory);
	return directory;
}

async function createExitedChildProcessId(): Promise<number> {
	const child = Bun.spawn([process.execPath, '-e', 'process.exit(0)'], {
		stderr: 'ignore',
		stdout: 'ignore',
	});
	expect(await child.exited).toBe(0);
	return child.pid;
}

const delay = (milliseconds: number): Promise<void> =>
	new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

const isProcessAlive = (processId: number): boolean => {
	try {
		process.kill(processId, 0);
		return true;
	} catch (error) {
		return !(typeof error === 'object' && error !== null && 'code' in error && error.code === 'ESRCH');
	}
};

type ProcessSnapshotEntry = {
	parentProcessId: number;
	processId: number;
};

async function readProcessSnapshot(): Promise<ProcessSnapshotEntry[]> {
	if (process.platform === 'win32') {
		const systemRoot = process.env.SystemRoot ?? process.env.windir ?? 'C:\\Windows';
		const powershellPath = join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
		const snapshot = Bun.spawn(
			[
				powershellPath,
				'-NoLogo',
				'-NoProfile',
				'-NonInteractive',
				'-Command',
				'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Json -Compress',
			],
			{ stderr: 'pipe', stdin: 'ignore', stdout: 'pipe', windowsHide: true }
		);
		const [exitCode, stdout, stderr] = await Promise.all([
			snapshot.exited,
			new Response(snapshot.stdout).text(),
			new Response(snapshot.stderr).text(),
		]);
		if (exitCode !== 0) {
			throw new Error(`No se pudo capturar el árbol de procesos: ${stderr.trim()}`);
		}

		const parsed = JSON.parse(stdout) as
			| { ParentProcessId: number; ProcessId: number }
			| { ParentProcessId: number; ProcessId: number }[];
		return (Array.isArray(parsed) ? parsed : [parsed]).map((entry) => ({
			parentProcessId: entry.ParentProcessId,
			processId: entry.ProcessId,
		}));
	}

	const snapshot = Bun.spawn(['ps', '-eo', 'pid=,ppid='], {
		stderr: 'pipe',
		stdin: 'ignore',
		stdout: 'pipe',
	});
	const [exitCode, stdout, stderr] = await Promise.all([
		snapshot.exited,
		new Response(snapshot.stdout).text(),
		new Response(snapshot.stderr).text(),
	]);
	if (exitCode !== 0) {
		throw new Error(`No se pudo capturar el árbol de procesos: ${stderr.trim()}`);
	}

	return stdout
		.split(/\r?\n/u)
		.map((line) => line.trim().split(/\s+/u).map(Number))
		.filter((parts) => parts.length === 2 && parts.every(Number.isSafeInteger))
		.map(([processId, parentProcessId]) => ({ parentProcessId, processId }));
}

function collectDescendantProcessIds(rootProcessId: number, snapshot: ProcessSnapshotEntry[]): number[] {
	const descendants = new Set<number>();
	const pending = [rootProcessId];
	while (pending.length > 0) {
		const parentProcessId = pending.shift();
		for (const entry of snapshot) {
			if (entry.parentProcessId !== parentProcessId || descendants.has(entry.processId)) {
				continue;
			}
			descendants.add(entry.processId);
			pending.push(entry.processId);
		}
	}
	return [...descendants];
}

async function terminateProcessTreeForTest(processId: number): Promise<void> {
	if (!isProcessAlive(processId)) {
		return;
	}

	if (process.platform === 'win32') {
		const systemRoot = process.env.SystemRoot ?? process.env.windir ?? 'C:\\Windows';
		const taskkillPath = join(systemRoot, 'System32', 'taskkill.exe');
		const taskkill = Bun.spawn([taskkillPath, '/PID', String(processId), '/T', '/F'], {
			stderr: 'ignore',
			stdin: 'ignore',
			stdout: 'ignore',
			windowsHide: true,
		});
		await taskkill.exited;
		return;
	}

	try {
		process.kill(-processId, 'SIGKILL');
	} catch {
		// El grupo ya terminó.
	}
}

async function waitForValue<T>(
	description: string,
	timeoutMs: number,
	readValue: () => Promise<T | undefined>
): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const value = await readValue();
		if (value !== undefined) {
			return value;
		}
		await delay(50);
	}

	throw new Error(`Se agotó la espera para ${description}.`);
}

async function readActiveTestRun(
	testRoot: string
): Promise<{ childProcessId: number; supervisorProcessId: number } | undefined> {
	try {
		const entries = await readdir(testRoot, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory() || !entry.name.startsWith('run-')) {
				continue;
			}

			const runDirectory = join(testRoot, entry.name);
			const marker = JSON.parse(await readFile(join(runDirectory, TEST_DATABASE_MARKER), 'utf8')) as {
				childProcessId?: unknown;
				state?: unknown;
				supervisorProcessId?: unknown;
			};
			if (
				marker.state === 'ready' &&
				typeof marker.childProcessId === 'number' &&
				marker.childProcessId > 0 &&
				typeof marker.supervisorProcessId === 'number' &&
				marker.supervisorProcessId > 0
			) {
				return {
					childProcessId: marker.childProcessId,
					supervisorProcessId: marker.supervisorProcessId,
				};
			}
		}
	} catch {
		return undefined;
	}

	return undefined;
}

async function waitForSubprocessExit(subprocess: ReturnType<typeof Bun.spawn>, timeoutMs: number): Promise<number> {
	const exitCode = await Promise.race([subprocess.exited, delay(timeoutMs).then(() => undefined)]);
	if (exitCode === undefined) {
		throw new Error(`El wrapper de pruebas no terminó dentro de ${timeoutMs}ms.`);
	}
	return exitCode;
}

async function runSignalShutdownCase(signal: 'SIGINT' | 'SIGTERM', expectedExitCode: number): Promise<void> {
	const testRoot = await createTemporaryDirectory();
	const fixtureDirectory = await createWorkspaceTemporaryDirectory();
	const fixturePath = join(fixtureDirectory, 'process-tree.test.ts');
	const fixtureMarkerPath = join(fixtureDirectory, 'process-tree.json');
	await writeFile(
		fixturePath,
		[
			'import { spawn } from "node:child_process";',
			'import { writeFile } from "node:fs/promises";',
			'import { test } from "vitest";',
			'test("mantiene árbol real", async () => {',
			'\tconst descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000);"], { stdio: "ignore", windowsHide: true });',
			'\tif (descendant.pid === undefined) throw new Error("No se creó el descendant de prueba.");',
			`\tawait writeFile(${JSON.stringify(fixtureMarkerPath)}, JSON.stringify({ workerProcessId: process.pid, descendantProcessId: descendant.pid }), "utf8");`,
			'\tawait new Promise(() => {});',
			'});',
		].join('\n'),
		'utf8'
	);
	const fixtureRelativePath = relative(workspacePath, fixturePath).replaceAll('\\', '/');
	const isolatedCommand = [
		process.execPath,
		'x',
		'vp',
		'test',
		'run',
		fixtureRelativePath,
		'--pool=forks',
		'--maxWorkers=1',
		'--no-file-parallelism',
		'--testTimeout=0',
		'--no-color',
	];
	const wrapperProgram = [
		`import { runIsolatedCommand } from ${JSON.stringify(runnerModuleUrl)};`,
		`const exitCode = await runIsolatedCommand({ command: ${JSON.stringify(isolatedCommand)}, cwd: ${JSON.stringify(workspacePath)}, testRootPath: ${JSON.stringify(testRoot)} });`,
		'process.exit(exitCode);',
	].join('\n');
	const wrapper = Bun.spawn([process.execPath, '-e', wrapperProgram], {
		cwd: workspacePath,
		stderr: 'inherit',
		stdin: 'ignore',
		stdout: 'inherit',
	});
	let childProcessId: number | undefined;
	let supervisorProcessId: number | undefined;
	let capturedProcessIds: number[] = [];

	try {
		const activeRun = await waitForValue(
			'el marker ready del supervisor',
			SIGNAL_TEST_START_TIMEOUT_MS,
			async () => await readActiveTestRun(testRoot)
		);
		childProcessId = activeRun.childProcessId;
		supervisorProcessId = activeRun.supervisorProcessId;
		expect(isProcessAlive(childProcessId)).toBe(true);
		expect(isProcessAlive(supervisorProcessId)).toBe(true);
		const fixtureProcesses = await waitForValue(
			'el árbol de procesos de bun x vitest',
			SIGNAL_TEST_START_TIMEOUT_MS,
			async () => {
				try {
					const marker = JSON.parse(await readFile(fixtureMarkerPath, 'utf8')) as {
						descendantProcessId?: unknown;
						workerProcessId?: unknown;
					};
					if (
						typeof marker.workerProcessId === 'number' &&
						marker.workerProcessId > 0 &&
						typeof marker.descendantProcessId === 'number' &&
						marker.descendantProcessId > 0
					) {
						return {
							descendantProcessId: marker.descendantProcessId,
							workerProcessId: marker.workerProcessId,
						};
					}
				} catch {
					return undefined;
				}
				return undefined;
			}
		);
		const processSnapshot = await readProcessSnapshot();
		const supervisorDescendants = collectDescendantProcessIds(supervisorProcessId, processSnapshot);
		expect(supervisorDescendants).toContain(childProcessId);
		expect(supervisorDescendants).toContain(fixtureProcesses.workerProcessId);
		expect(supervisorDescendants).toContain(fixtureProcesses.descendantProcessId);
		capturedProcessIds = [
			wrapper.pid,
			supervisorProcessId,
			...supervisorDescendants,
			fixtureProcesses.workerProcessId,
			fixtureProcesses.descendantProcessId,
		].filter((processId, index, allProcessIds) => allProcessIds.indexOf(processId) === index);

		wrapper.kill(signal);
		expect(await waitForSubprocessExit(wrapper, SIGNAL_TEST_CLEANUP_TIMEOUT_MS)).toBe(expectedExitCode);

		await waitForValue('el árbol terminado y el root vacío', SIGNAL_TEST_CLEANUP_TIMEOUT_MS, async () => {
			if (capturedProcessIds.some(isProcessAlive) || (await readdir(testRoot)).length !== 0) {
				return undefined;
			}
			return true;
		});
		for (const processId of capturedProcessIds) {
			expect(isProcessAlive(processId)).toBe(false);
		}
		expect(await readdir(testRoot)).toEqual([]);
	} finally {
		if (childProcessId !== undefined) {
			await terminateProcessTreeForTest(childProcessId);
		}
		if (isProcessAlive(wrapper.pid)) {
			try {
				wrapper.kill('SIGKILL');
			} catch {
				// El proceso ya terminó entre la comprobación y el kill.
			}
		}
		if (supervisorProcessId !== undefined && isProcessAlive(supervisorProcessId)) {
			try {
				process.kill(supervisorProcessId, 'SIGKILL');
			} catch {
				// El supervisor ya terminó entre la comprobación y el kill.
			}
		}
		await Promise.race([wrapper.exited, delay(2_000)]);
	}
}

async function runInteractiveStdinCase(): Promise<void> {
	const testRoot = await createTemporaryDirectory();
	const resultDirectory = await createTemporaryDirectory();
	const resultPath = join(resultDirectory, 'stdio-and-arguments.json');
	const expectedArguments = ['argument with spaces', 'quote"inside', 'trailing\\'];
	const command = [
		process.execPath,
		'-e',
		[
			'const input = await Bun.stdin.text();',
			`await Bun.write(${JSON.stringify(resultPath)}, JSON.stringify({ arguments: process.argv.slice(1), cwd: process.cwd(), environment: process.env.MEDIA_MANAGER_TEST_JOB_ARGUMENT, input: input.trim() }));`,
			'process.exit(input.trim() === "continue" ? 0 : 17);',
		].join('\n'),
		'--',
		...expectedArguments,
	];
	const wrapperProgram = [
		`import { runIsolatedCommand } from ${JSON.stringify(runnerModuleUrl)};`,
		`process.exit(await runIsolatedCommand({ command: ${JSON.stringify(command)}, cwd: ${JSON.stringify(workspacePath)}, environment: { ...process.env, MEDIA_MANAGER_TEST_JOB_ARGUMENT: "preserved" }, testRootPath: ${JSON.stringify(testRoot)} }));`,
	].join('\n');
	const wrapper = Bun.spawn([process.execPath, '-e', wrapperProgram], {
		cwd: workspacePath,
		stderr: 'pipe',
		stdin: 'pipe',
		stdout: 'pipe',
	});
	let childProcessId: number | undefined;

	try {
		const activeRun = await waitForValue(
			'el child interactivo',
			SIGNAL_TEST_START_TIMEOUT_MS,
			async () => await readActiveTestRun(testRoot)
		);
		childProcessId = activeRun.childProcessId;
		wrapper.stdin.write('continue\n');
		wrapper.stdin.end();

		expect(await waitForSubprocessExit(wrapper, SIGNAL_TEST_CLEANUP_TIMEOUT_MS)).toBe(0);
		expect(JSON.parse(await readFile(resultPath, 'utf8'))).toEqual({
			arguments: expectedArguments,
			cwd: workspacePath,
			environment: 'preserved',
			input: 'continue',
		});
		expect(await readdir(testRoot)).toEqual([]);
	} finally {
		if (childProcessId !== undefined) {
			await terminateProcessTreeForTest(childProcessId);
		}
		if (isProcessAlive(wrapper.pid)) {
			wrapper.kill('SIGKILL');
		}
		await Promise.race([wrapper.exited, delay(2_000)]);
	}
}

async function runNormalExitDetachedDescendantCase(): Promise<void> {
	const testRoot = await createTemporaryDirectory();
	const markerDirectory = await createTemporaryDirectory();
	const descendantMarkerPath = join(markerDirectory, 'detached-descendant.pid');
	const command = [
		process.execPath,
		'-e',
		[
			'import { spawn } from "node:child_process";',
			'import { writeFileSync } from "node:fs";',
			'const descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000);"], { detached: true, stdio: "ignore", windowsHide: true });',
			'if (descendant.pid === undefined) throw new Error("No se creó el descendiente desacoplado.");',
			`writeFileSync(${JSON.stringify(descendantMarkerPath)}, String(descendant.pid), "utf8");`,
			'descendant.unref();',
		].join('\n'),
	];
	let descendantProcessId: number | undefined;

	try {
		const uncontainedRoot = Bun.spawn(command, {
			cwd: workspacePath,
			stderr: 'inherit',
			stdin: 'ignore',
			stdout: 'inherit',
		});
		expect(await uncontainedRoot.exited).toBe(0);
		descendantProcessId = Number(await readFile(descendantMarkerPath, 'utf8'));
		expect(isProcessAlive(descendantProcessId)).toBe(true);
		await terminateProcessTreeForTest(descendantProcessId);
		await rm(descendantMarkerPath, { force: true });
		descendantProcessId = undefined;
		if (process.platform !== 'win32' && process.platform !== 'linux') {
			const unsupportedExitCode = await runIsolatedCommand({
				command,
				cwd: workspacePath,
				testRootPath: testRoot,
			});
			const preservedRuns = (await readdir(testRoot, { withFileTypes: true })).filter(
				(entry) => entry.isDirectory() && entry.name.startsWith('run-')
			);
			expect(unsupportedExitCode).toBe(1);
			expect(preservedRuns).toHaveLength(1);
			expect(existsSync(join(testRoot, preservedRuns[0].name, 'db.sqlite'))).toBe(true);
			return;
		}

		const exitCode = await runIsolatedCommand({
			command,
			cwd: workspacePath,
			testRootPath: testRoot,
		});
		descendantProcessId = Number(await readFile(descendantMarkerPath, 'utf8'));

		expect(exitCode).toBe(0);
		expect(Number.isSafeInteger(descendantProcessId)).toBe(true);
		expect(isProcessAlive(descendantProcessId)).toBe(false);
		expect(await readdir(testRoot)).toEqual([]);
	} finally {
		if (descendantProcessId !== undefined) {
			await terminateProcessTreeForTest(descendantProcessId);
		}
	}
}

async function readPreservedWindowsJobStatus(testRoot: string): Promise<{
	childProcessId: number;
	runDirectory: string;
	state: string;
}> {
	const entries = await readdir(testRoot, { withFileTypes: true });
	const runDirectories = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith('run-'));
	expect(runDirectories).toHaveLength(1);
	const runDirectory = join(testRoot, runDirectories[0].name);
	const [state, , rawChildProcessId] = (await readFile(join(runDirectory, 'windows-job-status'), 'utf8')).split(
		/\r?\n/u
	);
	return { childProcessId: Number(rawChildProcessId), runDirectory, state };
}

async function runWindowsJobAssignmentFailureCase(): Promise<void> {
	if (process.platform !== 'win32') {
		return;
	}

	const testRoot = await createTemporaryDirectory();
	const commandStartedPath = join(await createTemporaryDirectory(), 'command-started.txt');
	const command = [
		process.execPath,
		'-e',
		`await Bun.write(${JSON.stringify(commandStartedPath)}, String(process.pid)); setInterval(() => {}, 1000);`,
	];
	const environment = {
		...process.env,
		MEDIA_MANAGER_TEST_JOB_FORCE_ASSIGN_FAILURE: '1',
	};

	const exitCode = await runIsolatedCommand({ command, cwd: workspacePath, environment, testRootPath: testRoot });
	const status = await readPreservedWindowsJobStatus(testRoot);

	expect(exitCode).toBe(1);
	expect(Number.isSafeInteger(status.childProcessId)).toBe(true);
	expect(isProcessAlive(status.childProcessId)).toBe(false);
	expect(existsSync(join(status.runDirectory, 'db.sqlite'))).toBe(true);
	expect(existsSync(status.runDirectory)).toBe(true);
	expect(status.state).toBe('error');
	expect(existsSync(commandStartedPath)).toBe(false);
}

async function runNativeDirectHelperDeathCase(): Promise<void> {
	if (process.platform !== 'win32' && process.platform !== 'linux') {
		return;
	}

	const testRoot = await createTemporaryDirectory();
	const markerDirectory = await createTemporaryDirectory();
	const processMarkerPath = join(markerDirectory, 'helper-death-processes.json');
	const command = [
		process.execPath,
		'-e',
		[
			'import { spawn } from "node:child_process";',
			'const descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000);"], { detached: true, stdio: "ignore", windowsHide: true });',
			'if (descendant.pid === undefined) throw new Error("No se creó el descendiente.");',
			`await Bun.write(${JSON.stringify(processMarkerPath)}, JSON.stringify({ rootProcessId: process.pid, descendantProcessId: descendant.pid }));`,
			'descendant.unref();',
			'await new Promise(() => {});',
		].join('\n'),
	];
	const wrapperProgram = [
		`import { runIsolatedCommand } from ${JSON.stringify(runnerModuleUrl)};`,
		`process.exit(await runIsolatedCommand({ command: ${JSON.stringify(command)}, cwd: ${JSON.stringify(workspacePath)}, testRootPath: ${JSON.stringify(testRoot)} }));`,
	].join('\n');
	const wrapper = Bun.spawn([process.execPath, '-e', wrapperProgram], {
		cwd: workspacePath,
		stderr: 'inherit',
		stdin: 'ignore',
		stdout: 'inherit',
	});
	let helperProcessId: number | undefined;
	let rootProcessId: number | undefined;
	let descendantProcessId: number | undefined;
	let supervisorProcessId: number | undefined;

	try {
		const activeRun = await waitForValue(
			'el run controlado por el helper directo',
			SIGNAL_TEST_START_TIMEOUT_MS,
			async () => await readActiveTestRun(testRoot)
		);
		rootProcessId = activeRun.childProcessId;
		supervisorProcessId = activeRun.supervisorProcessId;
		const commandProcesses = await waitForValue('los procesos del comando', SIGNAL_TEST_START_TIMEOUT_MS, async () => {
			try {
				return JSON.parse(await readFile(processMarkerPath, 'utf8')) as {
					descendantProcessId: number;
					rootProcessId: number;
				};
			} catch {
				return undefined;
			}
		});
		descendantProcessId = commandProcesses.descendantProcessId;
		expect(commandProcesses.rootProcessId).toBe(rootProcessId);

		const snapshot = await readProcessSnapshot();
		helperProcessId = snapshot.find((entry) => entry.processId === rootProcessId)?.parentProcessId;
		expect(helperProcessId).toBeDefined();
		expect(snapshot.find((entry) => entry.processId === helperProcessId)?.parentProcessId).toBe(supervisorProcessId);
		expect(isProcessAlive(descendantProcessId)).toBe(true);

		process.kill(helperProcessId as number, 'SIGKILL');
		expect(await waitForSubprocessExit(wrapper, SIGNAL_TEST_CLEANUP_TIMEOUT_MS)).toBe(1);
		if (process.platform === 'win32') {
			await waitForValue('el Job cerrado al morir su dueño', SIGNAL_TEST_CLEANUP_TIMEOUT_MS, async () => {
				if (
					isProcessAlive(helperProcessId as number) ||
					isProcessAlive(rootProcessId as number) ||
					isProcessAlive(descendantProcessId as number)
				) {
					return undefined;
				}
				return true;
			});
		} else {
			expect(isProcessAlive(helperProcessId)).toBe(false);
		}
		const preservedRuns = (await readdir(testRoot, { withFileTypes: true })).filter(
			(entry) => entry.isDirectory() && entry.name.startsWith('run-')
		);
		expect(preservedRuns).toHaveLength(1);
		expect(existsSync(join(testRoot, preservedRuns[0].name, 'db.sqlite'))).toBe(true);
	} finally {
		for (const processId of [rootProcessId, descendantProcessId, helperProcessId]) {
			if (processId !== undefined) {
				await terminateProcessTreeForTest(processId);
			}
		}
		if (isProcessAlive(wrapper.pid)) {
			wrapper.kill('SIGKILL');
		}
		await Promise.race([wrapper.exited, delay(2_000)]);
	}
}

async function runNativeStopTimeoutFallbackCase(): Promise<void> {
	if (process.platform !== 'win32' && process.platform !== 'linux') {
		return;
	}

	const testRoot = await createTemporaryDirectory();
	const markerDirectory = await createTemporaryDirectory();
	const processMarkerPath = join(markerDirectory, 'stop-timeout-processes.json');
	const command = [
		process.execPath,
		'-e',
		[
			'import { spawn } from "node:child_process";',
			'const descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000);"], { detached: true, stdio: "ignore", windowsHide: true });',
			'if (descendant.pid === undefined) throw new Error("No se creó el descendiente.");',
			`await Bun.write(${JSON.stringify(processMarkerPath)}, JSON.stringify({ descendantProcessId: descendant.pid }));`,
			'descendant.unref();',
			'await new Promise(() => {});',
		].join('\n'),
	];
	const wrapperProgram = [
		`import { runIsolatedCommand } from ${JSON.stringify(runnerModuleUrl)};`,
		`process.exit(await runIsolatedCommand({ command: ${JSON.stringify(command)}, cwd: ${JSON.stringify(workspacePath)}, environment: { ...process.env, MEDIA_MANAGER_TEST_JOB_IGNORE_STOP: "1" }, testRootPath: ${JSON.stringify(testRoot)} }));`,
	].join('\n');
	const wrapper = Bun.spawn([process.execPath, '-e', wrapperProgram], {
		cwd: workspacePath,
		stderr: 'inherit',
		stdin: 'ignore',
		stdout: 'inherit',
	});
	let rootProcessId: number | undefined;
	let descendantProcessId: number | undefined;

	try {
		rootProcessId = (
			await waitForValue(
				'el child del fallback por timeout',
				SIGNAL_TEST_START_TIMEOUT_MS,
				async () => await readActiveTestRun(testRoot)
			)
		).childProcessId;
		descendantProcessId = (
			await waitForValue('el descendiente del fallback', SIGNAL_TEST_START_TIMEOUT_MS, async () => {
				try {
					return JSON.parse(await readFile(processMarkerPath, 'utf8')) as { descendantProcessId: number };
				} catch {
					return undefined;
				}
			})
		).descendantProcessId;

		wrapper.kill('SIGTERM');
		expect(await waitForSubprocessExit(wrapper, 45_000)).toBe(143);
		await waitForValue('el fallback posterior al timeout de stop', 30_000, async () => {
			if (isProcessAlive(rootProcessId as number) || isProcessAlive(descendantProcessId as number)) {
				return undefined;
			}
			const runs = (await readdir(testRoot, { withFileTypes: true })).filter(
				(entry) => entry.isDirectory() && entry.name.startsWith('run-')
			);
			return runs.length === 1 ? runs : undefined;
		});
		expect(isProcessAlive(rootProcessId)).toBe(false);
		expect(isProcessAlive(descendantProcessId)).toBe(false);
		const preservedRuns = (await readdir(testRoot, { withFileTypes: true })).filter(
			(entry) => entry.isDirectory() && entry.name.startsWith('run-')
		);
		expect(preservedRuns).toHaveLength(1);
		expect(existsSync(join(testRoot, preservedRuns[0].name, 'db.sqlite'))).toBe(true);
	} finally {
		for (const processId of [rootProcessId, descendantProcessId]) {
			if (processId !== undefined) {
				await terminateProcessTreeForTest(processId);
			}
		}
		if (isProcessAlive(wrapper.pid)) {
			wrapper.kill('SIGKILL');
		}
		await Promise.race([wrapper.exited, delay(2_000)]);
	}
}

async function runWindowsNativeHelperCacheRecoveryCase(): Promise<void> {
	if (process.platform !== 'win32') {
		return;
	}

	const testRoot = await createTemporaryDirectory();
	const sourcePath = resolve(workspacePath, 'scripts', 'windows-test-job.cs');
	const sourceHash = createHash('sha256')
		.update(await readFile(sourcePath))
		.digest('hex');
	const cacheDirectory = resolve(workspacePath, '.scratch', 'tooling');
	const executablePath = resolve(cacheDirectory, `windows-test-job-v2-${sourceHash}.exe`);
	const integrityPath = `${executablePath}.sha256`;
	const lockPath = `${executablePath}.lock`;

	expect(
		await runIsolatedCommand({
			command: [process.execPath, '-e', 'process.exit(0)'],
			cwd: workspacePath,
			testRootPath: testRoot,
		})
	).toBe(0);
	await waitForValue('el unlock del helper compilado', 15_000, async () => {
		try {
			await writeFile(executablePath, 'corrupt-helper', 'utf8');
			return true;
		} catch (error) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'code' in error &&
				(error.code === 'EBUSY' || error.code === 'EACCES' || error.code === 'EPERM')
			) {
				return undefined;
			}
			throw error;
		}
	});
	await mkdir(lockPath);
	await writeFile(
		join(lockPath, 'owner.json'),
		JSON.stringify({ processId: await createExitedChildProcessId(), startedAt: new Date(0).toISOString() }),
		'utf8'
	);
	const staleDate = new Date(Date.now() - 3 * 60 * 1000);
	await utimes(lockPath, staleDate, staleDate);

	expect(
		await runIsolatedCommand({
			command: [process.execPath, '-e', 'process.exit(17)'],
			cwd: workspacePath,
			testRootPath: testRoot,
		})
	).toBe(17);
	const [executableHash, recordedHash] = await Promise.all([
		readFile(executablePath).then((content) => createHash('sha256').update(content).digest('hex')),
		readFile(integrityPath, 'utf8'),
	]);
	expect(executableHash).toBe(recordedHash.trim());
	expect(existsSync(lockPath)).toBe(false);
	expect(await readdir(testRoot)).toEqual([]);
}

afterEach(async () => {
	setCleanupIdentityInterlockForTests();
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, recursive: true });
	}
});

describe('isolatedVitestCommand', () => {
	test('runs the project Vitest 5 CLI instead of vite-plus vp test', () => {
		const command = isolatedVitestCommand(['--run', '--silent=true']);
		expect(command).toEqual([process.execPath, 'x', 'vitest', '--run', '--silent=true']);
		expect(command).not.toContain('vp');
	});
});

describe('cleanupOrphanedTestRuns', () => {
	test('elimina un run huérfano válido, viejo y de un proceso terminado', async () => {
		const testRoot = await createTemporaryDirectory();
		const runDirectory = join(testRoot, 'run-orphan');
		const databasePath = join(runDirectory, 'db.sqlite');
		const processId = await createExitedChildProcessId();
		await mkdir(runDirectory);
		await writeFile(databasePath, 'temporary database', 'utf8');
		await writeFile(
			join(runDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					databasePath,
					processId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString()
				)
			),
			'utf8'
		);

		await cleanupOrphanedTestRuns(testRoot);

		expect(existsSync(runDirectory)).toBe(false);
	});

	test('conserva un run cuyo marker no tiene una fecha ISO válida', async () => {
		const testRoot = await createTemporaryDirectory();
		const runDirectory = join(testRoot, 'run-invalid-date');
		const databasePath = join(runDirectory, 'db.sqlite');
		const processId = await createExitedChildProcessId();
		await mkdir(runDirectory);
		await writeFile(databasePath, 'temporary database', 'utf8');
		await writeFile(
			join(runDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(databasePath, processId, '1')),
			'utf8'
		);

		await cleanupOrphanedTestRuns(testRoot);

		expect(existsSync(runDirectory)).toBe(true);
	});

	test('conserva un run cuyo marker no tiene versión de esquema', async () => {
		const testRoot = await createTemporaryDirectory();
		const runDirectory = join(testRoot, 'run-empty-schema-version');
		const databasePath = join(runDirectory, 'db.sqlite');
		const processId = await createExitedChildProcessId();
		await mkdir(runDirectory);
		await writeFile(databasePath, 'temporary database', 'utf8');
		await writeFile(
			join(runDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					databasePath,
					processId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString(),
					{ schemaVersion: '' }
				)
			),
			'utf8'
		);

		await cleanupOrphanedTestRuns(testRoot);

		expect(existsSync(runDirectory)).toBe(true);
	});

	test('conserva un run huérfano mientras su child sigue vivo', async () => {
		const testRoot = await createTemporaryDirectory();
		const runDirectory = join(testRoot, 'run-live-child');
		const databasePath = join(runDirectory, 'db.sqlite');
		const ownerProcessId = await createExitedChildProcessId();
		const liveChild = Bun.spawn([process.execPath, '-e', 'setInterval(() => {}, 1000);'], {
			stderr: 'ignore',
			stdin: 'ignore',
			stdout: 'ignore',
		});
		await mkdir(runDirectory);
		await writeFile(databasePath, 'temporary database', 'utf8');
		await writeFile(
			join(runDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					databasePath,
					ownerProcessId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString(),
					{ childProcessId: liveChild.pid }
				)
			),
			'utf8'
		);

		try {
			await cleanupOrphanedTestRuns(testRoot);

			expect(existsSync(runDirectory)).toBe(true);
			expect(isProcessAlive(liveChild.pid)).toBe(true);
		} finally {
			liveChild.kill('SIGKILL');
			await liveChild.exited;
		}
	}, 30_000);

	test('conserva un marker ready incompleto sin childProcessId', async () => {
		const testRoot = await createTemporaryDirectory();
		const runDirectory = join(testRoot, 'run-incomplete-ready');
		const databasePath = join(runDirectory, 'db.sqlite');
		const processId = await createExitedChildProcessId();
		const marker = createRunMarker(
			databasePath,
			processId,
			new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString()
		);
		delete marker.childProcessId;
		await mkdir(runDirectory);
		await writeFile(databasePath, 'temporary database', 'utf8');
		await writeFile(join(runDirectory, TEST_DATABASE_MARKER), JSON.stringify(marker), 'utf8');

		await cleanupOrphanedTestRuns(testRoot);

		expect(existsSync(runDirectory)).toBe(true);
	}, 30_000);

	test('sanea una cuarentena interrumpida válida y conserva una entrada ajena', async () => {
		const testRoot = await createTemporaryDirectory();
		const processId = await createExitedChildProcessId();
		const originalRunDirectory = join(testRoot, 'run-interrupted');
		const databasePath = join(originalRunDirectory, 'db.sqlite');
		const quarantineDirectory = join(testRoot, `.test-run-quarantine-run-interrupted-${randomUUID()}`);
		await mkdir(originalRunDirectory);
		await writeFile(databasePath, 'temporary database', 'utf8');
		await writeFile(
			join(originalRunDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					databasePath,
					processId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString()
				)
			),
			'utf8'
		);
		await rename(originalRunDirectory, quarantineDirectory);

		const foreignQuarantineDirectory = join(testRoot, `.test-run-quarantine-foreign-${randomUUID()}`);
		const foreignSentinelPath = join(foreignQuarantineDirectory, 'sentinel.txt');
		await mkdir(foreignQuarantineDirectory);
		await writeFile(foreignSentinelPath, 'keep', 'utf8');

		await cleanupOrphanedTestRuns(testRoot);

		expect(existsSync(quarantineDirectory)).toBe(false);
		expect(existsSync(foreignQuarantineDirectory)).toBe(true);
		expect(await readFile(foreignSentinelPath, 'utf8')).toBe('keep');
	}, 30_000);

	test('bloquea el cleanup si cambia la identidad tras tomar el handle de un run huérfano', async () => {
		if (process.platform !== 'win32' && process.platform !== 'linux') return;
		const testRoot = await createTemporaryDirectory();
		const processId = await createExitedChildProcessId();
		const runDirectory = join(testRoot, 'run-replaced-before-delete');
		const databasePath = join(runDirectory, 'db.sqlite');
		const savedOriginalDirectory = join(testRoot, 'saved-original-run');
		let lockedDirectory: string | undefined;
		let swapSucceeded = false;
		await mkdir(runDirectory);
		await writeFile(databasePath, 'owned database', 'utf8');
		await writeFile(
			join(runDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					databasePath,
					processId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString()
				)
			),
			'utf8'
		);
		setCleanupIdentityInterlockForTests(async (directory) => {
			lockedDirectory = directory;
			try {
				await rename(directory, savedOriginalDirectory);
				swapSucceeded = true;
				await mkdir(directory);
			} catch (error) {
				if (process.platform !== 'win32') throw error;
			}
			await writeFile(join(directory, 'replacement-sentinel.txt'), 'keep replacement', 'utf8');
			if (process.platform === 'win32') throw new Error('rename bloqueado por el handle nativo');
		});

		await cleanupOrphanedTestRuns(testRoot);

		expect(lockedDirectory).toBeDefined();
		expect(swapSucceeded).toBe(process.platform === 'linux');
		if (process.platform === 'win32') {
			expect(await readFile(join(lockedDirectory as string, 'db.sqlite'), 'utf8')).toBe('owned database');
		} else {
			expect(existsSync(savedOriginalDirectory)).toBe(true);
			expect(existsSync(join(savedOriginalDirectory, 'db.sqlite'))).toBe(false);
		}
		expect(await readFile(join(lockedDirectory as string, 'replacement-sentinel.txt'), 'utf8')).toBe(
			'keep replacement'
		);
	}, 30_000);

	test('bloquea el cleanup si cambia la identidad de una cuarentena tras tomar su handle', async () => {
		if (process.platform !== 'win32' && process.platform !== 'linux') return;
		const testRoot = await createTemporaryDirectory();
		const processId = await createExitedChildProcessId();
		const originalRunDirectory = join(testRoot, 'run-interrupted-replaced');
		const databasePath = join(originalRunDirectory, 'db.sqlite');
		const quarantineDirectory = join(testRoot, `.test-run-quarantine-run-interrupted-replaced-${randomUUID()}`);
		const savedOriginalDirectory = join(testRoot, 'saved-original-quarantine');
		let lockedDirectory: string | undefined;
		let swapSucceeded = false;
		await mkdir(originalRunDirectory);
		await writeFile(databasePath, 'quarantined database', 'utf8');
		await writeFile(
			join(originalRunDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					databasePath,
					processId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString()
				)
			),
			'utf8'
		);
		await rename(originalRunDirectory, quarantineDirectory);
		setCleanupIdentityInterlockForTests(async (directory) => {
			lockedDirectory = directory;
			try {
				await rename(directory, savedOriginalDirectory);
				swapSucceeded = true;
				await mkdir(directory);
			} catch (error) {
				if (process.platform !== 'win32') throw error;
			}
			await writeFile(join(directory, 'replacement-sentinel.txt'), 'keep quarantine replacement', 'utf8');
			if (process.platform === 'win32') throw new Error('rename bloqueado por el handle nativo');
		});

		await cleanupOrphanedTestRuns(testRoot);

		expect(lockedDirectory).toBeDefined();
		expect(swapSucceeded).toBe(process.platform === 'linux');
		if (process.platform === 'win32') {
			expect(await readFile(join(lockedDirectory as string, 'db.sqlite'), 'utf8')).toBe('quarantined database');
		} else {
			expect(existsSync(savedOriginalDirectory)).toBe(true);
			expect(existsSync(join(savedOriginalDirectory, 'db.sqlite'))).toBe(false);
		}
		expect(await readFile(join(lockedDirectory as string, 'replacement-sentinel.txt'), 'utf8')).toBe(
			'keep quarantine replacement'
		);
	}, 30_000);

	test('conserva cada run que no cumple todos los límites de borrado', async () => {
		const testRoot = await createTemporaryDirectory();
		const outsideDirectory = await createTemporaryDirectory();
		const processId = await createExitedChildProcessId();
		const oldStartedAt = new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString();
		const outsideDatabasePath = join(outsideDirectory, 'outside.sqlite');
		await writeFile(outsideDatabasePath, 'outside database', 'utf8');

		const noMarkerDirectory = join(testRoot, 'run-no-marker');
		await mkdir(noMarkerDirectory);
		await writeFile(join(noMarkerDirectory, 'db.sqlite'), 'temporary database', 'utf8');

		const invalidMarkerDirectory = join(testRoot, 'run-invalid-marker');
		await mkdir(invalidMarkerDirectory);
		await writeFile(join(invalidMarkerDirectory, 'db.sqlite'), 'temporary database', 'utf8');
		await writeFile(join(invalidMarkerDirectory, TEST_DATABASE_MARKER), '{invalid', 'utf8');

		const incorrectOwnerDirectory = join(testRoot, 'run-incorrect-owner');
		const incorrectOwnerDatabasePath = join(incorrectOwnerDirectory, 'db.sqlite');
		await mkdir(incorrectOwnerDirectory);
		await writeFile(incorrectOwnerDatabasePath, 'temporary database', 'utf8');
		await writeFile(
			join(incorrectOwnerDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(incorrectOwnerDatabasePath, processId, oldStartedAt, { owner: 'another-owner' })),
			'utf8'
		);

		const liveProcessDirectory = join(testRoot, 'run-live-process');
		const liveProcessDatabasePath = join(liveProcessDirectory, 'db.sqlite');
		await mkdir(liveProcessDirectory);
		await writeFile(liveProcessDatabasePath, 'temporary database', 'utf8');
		await writeFile(
			join(liveProcessDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(liveProcessDatabasePath, process.pid, oldStartedAt)),
			'utf8'
		);

		const youngDirectory = join(testRoot, 'run-young');
		const youngDatabasePath = join(youngDirectory, 'db.sqlite');
		await mkdir(youngDirectory);
		await writeFile(youngDatabasePath, 'temporary database', 'utf8');
		await writeFile(
			join(youngDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(youngDatabasePath, processId, new Date().toISOString())),
			'utf8'
		);

		const outsideDatabaseDirectory = join(testRoot, 'run-outside-database');
		await mkdir(outsideDatabaseDirectory);
		await writeFile(
			join(outsideDatabaseDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(outsideDatabasePath, processId, oldStartedAt)),
			'utf8'
		);

		const indirectDatabaseDirectory = join(testRoot, 'run-indirect-database');
		await mkdir(indirectDatabaseDirectory);
		await writeFile(join(indirectDatabaseDirectory, 'db.sqlite'), 'temporary database', 'utf8');
		await writeFile(
			join(indirectDatabaseDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(join(indirectDatabaseDirectory, 'nested', 'db.sqlite'), processId, oldStartedAt)),
			'utf8'
		);

		const nonRunDirectory = join(testRoot, 'preserve-this-directory');
		const nonRunDatabasePath = join(nonRunDirectory, 'db.sqlite');
		await mkdir(nonRunDirectory);
		await writeFile(nonRunDatabasePath, 'temporary database', 'utf8');
		await writeFile(
			join(nonRunDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(nonRunDatabasePath, processId, oldStartedAt)),
			'utf8'
		);

		await cleanupOrphanedTestRuns(testRoot);

		for (const directory of [
			noMarkerDirectory,
			invalidMarkerDirectory,
			incorrectOwnerDirectory,
			liveProcessDirectory,
			youngDirectory,
			outsideDatabaseDirectory,
			indirectDatabaseDirectory,
			nonRunDirectory,
		]) {
			expect(existsSync(directory)).toBe(true);
		}
		expect(existsSync(outsideDatabasePath)).toBe(true);
	});

	test('limpia el huérfano inicial y el run actual tras el exit code terminal del child', async () => {
		const testRoot = await createTemporaryDirectory();
		const orphanDirectory = join(testRoot, 'run-before-child');
		const orphanDatabasePath = join(orphanDirectory, 'db.sqlite');
		const processId = await createExitedChildProcessId();
		await mkdir(orphanDirectory);
		await writeFile(orphanDatabasePath, 'temporary database', 'utf8');
		await writeFile(
			join(orphanDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					orphanDatabasePath,
					processId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString()
				)
			),
			'utf8'
		);

		const exitCode = await runIsolatedCommand({
			command: [process.execPath, '-e', 'process.exit(143)'],
			cwd: workspacePath,
			testRootPath: testRoot,
		});

		expect(exitCode).toBe(143);
		expect(existsSync(orphanDirectory)).toBe(false);
		expect(await readdir(testRoot)).toEqual([]);
	}, 60_000);

	test('rechaza un testRoot junction y conserva todos los datos externos', async () => {
		const sandbox = await createTemporaryDirectory();
		const externalRoot = await createTemporaryDirectory();
		const junctionPath = join(sandbox, 'test-root-junction');
		const orphanDirectory = join(externalRoot, 'run-owned-outside');
		const databasePath = join(orphanDirectory, 'db.sqlite');
		const processId = await createExitedChildProcessId();
		const sentinelPath = join(externalRoot, 'sentinel.txt');
		await mkdir(orphanDirectory);
		await writeFile(databasePath, 'temporary database', 'utf8');
		await writeFile(sentinelPath, 'keep', 'utf8');
		await writeFile(
			join(orphanDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(
				createRunMarker(
					databasePath,
					processId,
					new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString()
				)
			),
			'utf8'
		);
		await symlink(externalRoot, junctionPath, 'junction');
		await expect(cleanupOrphanedTestRuns(junctionPath)).resolves.toEqual([]);

		await expect(
			runIsolatedCommand({
				command: [process.execPath, '-e', 'process.exit(0)'],
				cwd: workspacePath,
				testRootPath: junctionPath,
			})
		).rejects.toThrow('directorio físico');
		await expect(
			runIsolatedCommand({
				command: [process.execPath, '-e', 'process.exit(0)'],
				cwd: workspacePath,
				testRootPath: join(junctionPath, 'new-test-root'),
			})
		).rejects.toThrow('directorio físico');

		expect(existsSync(orphanDirectory)).toBe(true);
		expect(existsSync(databasePath)).toBe(true);
		expect(existsSync(sentinelPath)).toBe(true);
		expect(existsSync(join(externalRoot, 'new-test-root'))).toBe(false);
	});

	test('conserva runs, markers y DBs que atraviesan symlinks o junctions', async () => {
		const testRoot = await createTemporaryDirectory();
		const externalRoot = await createTemporaryDirectory();
		const processId = await createExitedChildProcessId();
		const startedAt = new Date(Date.now() - ORPHANED_TEST_RUN_MINIMUM_AGE_MS - 1_000).toISOString();

		const externalRunDirectory = join(externalRoot, 'external-run');
		const externalRunDatabasePath = join(externalRunDirectory, 'db.sqlite');
		await mkdir(externalRunDirectory);
		await writeFile(externalRunDatabasePath, 'external database', 'utf8');
		await writeFile(
			join(externalRunDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(externalRunDatabasePath, processId, startedAt)),
			'utf8'
		);
		const runJunctionPath = join(testRoot, 'run-junction');
		await symlink(externalRunDirectory, runJunctionPath, 'junction');

		const markerSymlinkRunDirectory = join(testRoot, 'run-marker-symlink');
		const markerSymlinkDatabasePath = join(markerSymlinkRunDirectory, 'db.sqlite');
		const externalMarkerPath = join(externalRoot, 'marker.json');
		await mkdir(markerSymlinkRunDirectory);
		await writeFile(markerSymlinkDatabasePath, 'temporary database', 'utf8');
		await writeFile(
			externalMarkerPath,
			JSON.stringify(createRunMarker(markerSymlinkDatabasePath, processId, startedAt)),
			'utf8'
		);
		await symlink(externalMarkerPath, join(markerSymlinkRunDirectory, TEST_DATABASE_MARKER), 'file');

		const databaseSymlinkRunDirectory = join(testRoot, 'run-database-symlink');
		const databaseSymlinkPath = join(databaseSymlinkRunDirectory, 'db.sqlite');
		const externalDatabasePath = join(externalRoot, 'database.sqlite');
		await mkdir(databaseSymlinkRunDirectory);
		await writeFile(externalDatabasePath, 'external database', 'utf8');
		await symlink(externalDatabasePath, databaseSymlinkPath, 'file');
		await writeFile(
			join(databaseSymlinkRunDirectory, TEST_DATABASE_MARKER),
			JSON.stringify(createRunMarker(databaseSymlinkPath, processId, startedAt)),
			'utf8'
		);

		await cleanupOrphanedTestRuns(testRoot);

		expect(existsSync(runJunctionPath)).toBe(true);
		expect(existsSync(externalRunDatabasePath)).toBe(true);
		expect(existsSync(markerSymlinkRunDirectory)).toBe(true);
		expect(existsSync(externalMarkerPath)).toBe(true);
		expect(existsSync(databaseSymlinkRunDirectory)).toBe(true);
		expect(existsSync(externalDatabasePath)).toBe(true);
	});

	test('la caja negra SIGINT termina el child y limpia el root del supervisor', async () => {
		await runSignalShutdownCase('SIGINT', 130);
	}, 90_000);

	test('la caja negra SIGTERM termina el child y limpia el root del supervisor', async () => {
		await runSignalShutdownCase('SIGTERM', 143);
	}, 90_000);

	test('espera la contención nativa completa cuando la raíz termina antes que un descendiente desacoplado', async () => {
		await runNormalExitDetachedDescendantCase();
	}, 60_000);

	test('conserva el exit code del proceso raíz después de vaciar su Job Object', async () => {
		const testRoot = await createTemporaryDirectory();
		const exitCode = await runIsolatedCommand({
			command: [process.execPath, '-e', 'process.exit(17)'],
			cwd: workspacePath,
			testRootPath: testRoot,
		});

		expect(exitCode).toBe(17);
		expect(await readdir(testRoot)).toEqual([]);
	}, 60_000);

	test('falla cerrado si Windows rechaza la asignación al Job Object', async () => {
		await runWindowsJobAssignmentFailureCase();
	}, 60_000);

	test('matar el helper directo conserva el run sin recibo de cleanup', async () => {
		await runNativeDirectHelperDeathCase();
	}, 60_000);

	test('el fallback mata el helper tras vencer el stop y conserva el run', async () => {
		await runNativeStopTimeoutFallbackCase();
	}, 90_000);

	test('recompila un helper corrupto y sanea su lock viejo sin dueño', async () => {
		await runWindowsNativeHelperCacheRecoveryCase();
	}, 60_000);

	test('conserva stdin interactivo hasta el child', async () => {
		await runInteractiveStdinCase();
	}, 60_000);
});
