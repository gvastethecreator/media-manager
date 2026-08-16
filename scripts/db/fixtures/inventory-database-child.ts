import { inventoryDatabase } from '../database-safety';

const databasePath = process.argv[2];
const generatedAt = process.argv[3];
if (!databasePath) {
	console.error('Falta el path de la base restaurada.');
	process.exit(2);
}

try {
	const inventory = await inventoryDatabase(databasePath, generatedAt ? new Date(generatedAt) : undefined);
	process.stdout.write(JSON.stringify(inventory));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
