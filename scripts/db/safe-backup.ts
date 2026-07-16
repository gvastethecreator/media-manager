import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
	createVerifiedBackup,
	inventoryDatabase,
	resolveDatabasePath,
	restoreVerifiedBackup,
	verifyExistingBackup,
} from './database-safety';

const HELP = `media-manager-db — inventario y backup verificable de SQLite

Uso:
  bun run db:inventory -- --database <ruta|file:url> [--json]
  bun run db:backup -- --database <ruta|file:url> --output <directorio-externo> [--json]
  bun run db:backup:verify -- --backup <archivo.sqlite> [--manifest <archivo.json>] [--json]
  bun run db:restore -- --backup <archivo.sqlite> --output <nueva.sqlite> [--manifest <archivo.json>] [--json]

Opciones:
  --database <valor>   Base SQLite local. Alternativa: DATABASE_URL.
  --output <directorio> Directorio de destino; debe quedar fuera del workspace/Git.
  --backup <archivo>   Backup a verificar.
  --manifest <archivo> Manifest; por defecto <backup>.manifest.json.
  --root-id <id>       ID opaco de media root referenciado; repetible.
  --json               Salida JSON estable por stdout.
  -h, --help           Mostrar esta ayuda.
  --version            Mostrar versión del proyecto.

Ejemplos:
  bun run db:inventory -- --database file:./db.sqlite
  bun run db:backup -- --database file:./db.sqlite --output D:\\Backups\\media-manager
  bun run db:backup:verify -- --backup D:\\Backups\\media-manager\\media-manager-backup-....sqlite
`;

type CliValues = {
	backup?: string;
	database?: string;
	help?: boolean;
	json?: boolean;
	manifest?: string;
	output?: string;
	'root-id'?: string[];
	version?: boolean;
};

class UsageError extends Error {}

function required(value: string | undefined, flag: string): string {
	if (!value) {
		throw new UsageError(`Falta ${flag}. Usa --help para ver ejemplos.`);
	}
	return value;
}

function reportProgress(message: string): void {
	if (process.stderr.isTTY) {
		console.error(message);
	}
}

function printInventory(path: string, inventory: Awaited<ReturnType<typeof inventoryDatabase>>, asJson: boolean): void {
	if (asJson) {
		console.log(JSON.stringify({ databasePath: path, inventory }, null, 2));
		return;
	}
	console.log(`Base: ${path}`);
	console.log(`Tamaño: ${inventory.byteSize} bytes`);
	console.log(`Integridad: ${inventory.quickCheck}`);
	console.log(`Journal: ${inventory.journalMode}`);
	console.log(`Schema SHA-256: ${inventory.schemaHash}`);
	console.log(`Tablas: ${Object.keys(inventory.tableCounts).length}`);
}

async function getVersion(): Promise<string> {
	const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as {
		version?: string;
	};
	return packageJson.version ?? 'unknown';
}

export async function runCli(args = process.argv.slice(2)): Promise<void> {
	if (args.includes('--help') || args.includes('-h')) {
		console.log(HELP);
		return;
	}
	if (args.includes('--version')) {
		console.log(await getVersion());
		return;
	}

	const { positionals, values } = parseArgs({
		allowPositionals: true,
		args,
		options: {
			backup: { type: 'string' },
			database: { type: 'string' },
			help: { short: 'h', type: 'boolean' },
			json: { type: 'boolean' },
			manifest: { type: 'string' },
			output: { type: 'string' },
			'root-id': { multiple: true, type: 'string' },
			version: { type: 'boolean' },
		},
		strict: true,
	});
	const options = values as CliValues;
	const command = positionals[0];
	if (!command || positionals.length !== 1) {
		throw new UsageError('Indica exactamente un subcomando: inventory, backup, verify o restore. Usa --help.');
	}

	if (command === 'inventory') {
		const databasePath = resolveDatabasePath(required(options.database ?? process.env.DATABASE_URL, '--database'));
		reportProgress('Inspeccionando schema, integridad y conteos…');
		printInventory(databasePath, await inventoryDatabase(databasePath), options.json === true);
		return;
	}
	if (command === 'backup') {
		const databasePath = resolveDatabasePath(required(options.database ?? process.env.DATABASE_URL, '--database'));
		reportProgress('Creando snapshot y verificando restore temporal…');
		const result = await createVerifiedBackup({
			appVersion: await getVersion(),
			databasePath,
			outputDirectory: required(options.output, '--output'),
			rootReferences: options['root-id'],
			workspaceRoot: process.cwd(),
		});
		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(`Backup verificado: ${result.backupPath}`);
			console.log(`Manifest: ${result.manifestPath}`);
			console.log(`SHA-256: ${result.manifest.sha256}`);
		}
		return;
	}
	if (command === 'restore') {
		const backupPath = resolve(required(options.backup, '--backup'));
		const result = await restoreVerifiedBackup({
			backupPath,
			manifestPath: options.manifest ? resolve(options.manifest) : undefined,
			outputPath: required(options.output, '--output'),
		});
		if (options.json) console.log(JSON.stringify({ ...result, restored: true }, null, 2));
		else console.log(`Restore verificado creado sin sobrescritura: ${result.outputPath}`);
		return;
	}
	if (command === 'verify') {
		const backupPath = resolve(required(options.backup, '--backup'));
		reportProgress('Verificando hash, integridad y restore temporal…');
		const manifest = await verifyExistingBackup({
			backupPath,
			manifestPath: options.manifest ? resolve(options.manifest) : undefined,
		});
		if (options.json) {
			console.log(JSON.stringify({ backupPath, manifest, verified: true }, null, 2));
		} else {
			console.log(`Backup válido y restaurable: ${backupPath}`);
			console.log(`SHA-256: ${manifest.sha256}`);
		}
		return;
	}

	throw new UsageError(`Subcomando desconocido: ${command}. Usa --help.`);
}

if (import.meta.main) {
	runCli().catch((error: unknown) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		if (process.env.DEBUG === '1' && error instanceof Error) {
			console.error(error.stack);
		}
		process.exitCode = error instanceof TypeError || error instanceof UsageError ? 2 : 1;
	});
}
