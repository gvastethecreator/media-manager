#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createLocalSessionEnvironment } from './local-session-environment.js';

const environment = createLocalSessionEnvironment();
const processes = [];
let stopping = false;

async function assertPortAvailable(url) {
	const address = new URL(url);
	const probe = createServer();
	await new Promise((resolve, reject) => {
		probe.once('error', reject);
		probe.listen(Number(address.port), address.hostname, resolve);
	});
	await new Promise((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
}

function stop(code) {
	if (stopping) return;
	stopping = true;
	process.exitCode = code;
	for (const child of processes) {
		if (child.exitCode !== null || child.killed) continue;
		if (process.platform === 'win32') {
			const cleanup = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
				stdio: 'ignore',
				windowsHide: true,
			});
			cleanup.on('error', (error) => {
				console.error(`Could not stop development process ${child.pid}: ${error.message}`);
				process.exitCode = 1;
			});
		} else {
			child.kill('SIGTERM');
		}
	}
}

function launch(script, prefix) {
	const child = spawn(process.execPath, [script], {
		cwd: process.cwd(),
		env: environment,
		stdio: ['inherit', 'pipe', 'pipe'],
	});
	processes.push(child);
	for (const stream of [child.stdout, child.stderr]) {
		stream.on('data', (data) => {
			for (const line of data.toString().split(/\r?\n/).filter(Boolean)) console.log(`[${prefix}] ${line}`);
		});
	}
	child.on('error', (error) => {
		console.error(`[${prefix}] ${error.message}`);
		stop(1);
	});
	child.on('close', (code) => {
		if (!stopping) stop(code ?? 1);
	});
	return child;
}

async function waitForReady(url) {
	const deadline = Date.now() + 120_000;
	while (Date.now() < deadline && !stopping) {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
			await response.body?.cancel();
			if (response.ok) return true;
		} catch {
			// Readiness can fail while the child starts.
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	return false;
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0));
console.log('Starting development servers.');
const backendUrl = environment.MEDIA_MANAGER_API_TARGET;
const frontendUrl = `http://${environment.VITE_HOST || '127.0.0.1'}:${environment.VITE_PORT || '5173'}`;
try {
	await assertPortAvailable(backendUrl);
	await assertPortAvailable(frontendUrl);
} catch (error) {
	console.error(`[DEV] Development port is unavailable: ${error.message}`);
	process.exit(1);
}
launch('scripts/dev-server-hot.js', 'SERVER');
if (await waitForReady(`${backendUrl}/health`)) {
	if (!stopping) {
		launch('scripts/dev-vite-headers.js', 'VITE');
		if (await waitForReady(frontendUrl)) {
			if (!stopping) console.log(`[DEV] Development ready. Frontend: ${frontendUrl} Backend: ${backendUrl}`);
		} else if (!stopping) {
			console.error('[DEV] Frontend did not become ready.');
			stop(1);
		}
	}
} else if (!stopping) {
	console.error('[DEV] Backend did not become ready.');
	stop(1);
}
