import { promises as fs } from 'fs';
import path from 'path';

describe('server actions docs', () => {
	it('lists every actions folder in server-actions.md', async () => {
		const rootDir = path.resolve(__dirname, '../../../..');
		const actionsDir = path.join(rootDir, 'src/app/actions');
		const docPath = path.join(rootDir, 'docs/server-actions.md');
		const doc = await fs.readFile(docPath, 'utf8');
		const entries = await fs.readdir(actionsDir, { withFileTypes: true });
		for (const dir of entries) {
			if (!dir.isDirectory() || dir.name.startsWith('__')) continue;
			const readmePath = path.join(actionsDir, dir.name, 'README.md');
			const readme = await fs.readFile(readmePath, 'utf8');
			expect(readme).toContain('## Funciones disponibles');
			expect(doc).toContain(`## ${dir.name}`);
		}
	});
});
