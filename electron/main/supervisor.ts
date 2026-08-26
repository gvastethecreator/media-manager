import { type ChildProcess, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createProductionRuntimeConfig } from '../../src/runtime/production-runtime-config';
import { resolveDesktopLibraryPaths } from './data-dir';
import type { BackendStatus } from '../shared/ipc-contract';

export interface SupervisorOptions {
	bunExecutable: string;
	startScript: string;
	userDataDir: string;
	workspaceRoot: string;
	extraEnv?: Record<string, string | undefined>;
	healthUrl?: string;
	healthTimeoutMs?: number;
	onLog?: (message: string) => void;
}

function sleep(ms: number): Promise<void> {
	return new Promise((done) => {
		setTimeout(done, ms);
	});
}

export class BunSupervisor {
	private child: ChildProcess | undefined;
	private status: BackendStatus = 'stopped';

	constructor(private readonly options: SupervisorOptions) {}

	getStatus(): BackendStatus {
		return this.status;
	}

	getPid(): number | undefined {
		return this.child?.pid;
	}

	async start(): Promise<BackendStatus> {
		this.status = 'starting';
		const paths = resolveDesktopLibraryPaths(this.options.userDataDir);
		const config = createProductionRuntimeConfig({
			...process.env,
			...this.options.extraEnv,
			DATABASE_URL: paths.databaseUrl,
			NODE_ENV: 'production',
		});
		this.child = spawn(this.options.bunExecutable, [this.options.startScript], {
			cwd: this.options.workspaceRoot,
			env: {
				...process.env,
				...config.runtimeEnvironment,
				...this.options.extraEnv,
				DATABASE_URL: paths.databaseUrl,
				MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL: paths.recoveryJournal,
				MEDIA_MANAGER_LOG_DIR: paths.logsDir,
				UPLOADS_DIR: paths.uploadsDir,
			},
			stdio: ['ignore', 'pipe', 'pipe'],
			windowsHide: true,
		});
		this.child.on('error', (error) => {
			this.status = 'degraded';
			this.options.onLog?.(`supervisor spawn error ${error instanceof Error ? error.message : String(error)}`);
		});
		this.child.stdout?.on('data', (chunk) => {
			this.options.onLog?.(`supervisor stdout ${String(chunk).trim()}`);
		});
		this.child.stderr?.on('data', (chunk) => {
			this.options.onLog?.(`supervisor stderr ${String(chunk).trim()}`);
		});
		this.child.on('exit', (code, signal) => {
			this.options.onLog?.(`supervisor exit code=${code} signal=${signal}`);
			if (this.status !== 'stopped') this.status = 'degraded';
		});
		const ready = await this.waitForHealth(
			this.options.healthUrl ?? `http://127.0.0.1:${config.publicPort}/health`
		);
		this.status = ready ? 'ready' : 'degraded';
		return this.status;
	}

	async stop(): Promise<void> {
		this.status = 'stopped';
		if (!this.child || this.child.exitCode !== null) {
			this.child = undefined;
			return;
		}
		const child = this.child;
		child.kill('SIGTERM');
		await new Promise<void>((done) => {
			const timer = setTimeout(() => {
				if (child.exitCode === null) child.kill('SIGKILL');
				done();
			}, 8_000);
			child.once('exit', () => {
				clearTimeout(timer);
				done();
			});
		});
		this.child = undefined;
	}

	async retry(): Promise<BackendStatus> {
		await this.stop();
		return this.start();
	}

	private async waitForHealth(url: string): Promise<boolean> {
		const deadline = Date.now() + (this.options.healthTimeoutMs ?? 20_000);
		while (Date.now() < deadline) {
			try {
				const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
				if (response.ok) return true;
			} catch {
				// Wait until the broker publishes ready.
			}
			await sleep(250);
		}
		return false;
	}
}

export function resolveStartScript(workspaceRoot: string): string {
	return resolve(workspaceRoot, 'scripts/start-production.ts');
}
