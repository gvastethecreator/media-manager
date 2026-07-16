import { upgradeDatabase } from '../upgrade';

const [databasePath, backupDirectory, outputPath, workspaceRoot, migrationsDirectory] = process.argv.slice(2);

if (!(databasePath && backupDirectory && outputPath && workspaceRoot)) {
	console.error('upgrade child requires source, backup directory, output and workspace root');
	process.exit(2);
}

try {
	const result = await upgradeDatabase({
		appVersion: '0.1.0-test',
		backupDirectory,
		databasePath,
		migrationsDirectory: migrationsDirectory || undefined,
		outputPath,
		rootReferences: ['library'],
		workspaceRoot,
	});
	console.log(JSON.stringify(result));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
