import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('isolated Vitest runner', () => {
	it('executes under a published Vitest 5.x', () => {
		expect(require('vitest/package.json').version).toMatch(/^5\./);
	});
});
