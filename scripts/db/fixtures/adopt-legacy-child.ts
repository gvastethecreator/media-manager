import { adoptLegacyBackup, type LegacyAdoptionReport } from '../legacy-adoption';

const [backupPath, manifestPath, outputPath, workspaceRoot] = process.argv.slice(2);
if (!(backupPath && manifestPath && outputPath && workspaceRoot)) {
	console.error('Missing adoption fixture arguments.');
	process.exit(2);
}

try {
	const report: LegacyAdoptionReport = await adoptLegacyBackup({
		backupPath,
		manifestPath,
		outputPath,
		workspaceRoot,
	});
	process.stdout.write(JSON.stringify(report));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
