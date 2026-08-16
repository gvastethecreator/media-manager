import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dir, '..');

describe('debug route safety', () => {
	it('does not expose the legacy destructive phantom-image cleanup', async () => {
		const source = await readFile(resolve(workspaceRoot, 'src/server/routes/debug/index.ts'), 'utf8');

		expect(source).not.toMatch(/router\.(?:get|post|put|patch|delete)\(\s*['"`]\/cleanup-phantom-images/);
		expect(source).not.toMatch(/DELETE\s+FROM\s+Image\s+WHERE\s+id\s+LIKE\s+['"]cursed-img-%/i);
	});
});
