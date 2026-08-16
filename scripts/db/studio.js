#!/usr/bin/env bun

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { resolveDatabasePath } from './database-safety.ts';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		database: { type: 'string' },
		port: { type: 'string' },
	},
	strict: true,
});

if (!values.database) {
	console.error('Uso: bun run db:studio -- --database <ruta|file:url> [--port 4983]');
	process.exit(2);
}

const databasePath = resolveDatabasePath(values.database);
if (!existsSync(databasePath)) {
	console.error('La base seleccionada no existe; Studio nunca crea ni elige una DB por fallback.');
	process.exit(1);
}

const port = values.port ?? '4983';
if (!/^\d{2,5}$/.test(port)) {
	console.error('--port debe ser un número válido.');
	process.exit(2);
}

console.log(`Drizzle Studio local: http://127.0.0.1:${port}`);
const result = spawnSync('bunx', ['drizzle-kit', 'studio', '--host', '127.0.0.1', '--port', port], {
	cwd: process.cwd(),
	env: { ...process.env, DATABASE_URL: pathToFileURL(databasePath).href },
	stdio: 'inherit',
	shell: true,
});
process.exitCode = result.status ?? 1;
