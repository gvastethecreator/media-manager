import { Database } from 'bun:sqlite';

const [sourcePath, outputPath] = process.argv.slice(2);
if (!(sourcePath && outputPath)) {
	console.error('vacuum child requires source and output paths');
	process.exit(2);
}

const source = new Database(sourcePath, { readonly: true, strict: true });
try {
	source.run('VACUUM INTO ?', outputPath);
} finally {
	source.clearQueryCache();
	source.close();
}
