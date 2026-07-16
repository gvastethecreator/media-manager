import { describe, expect, it } from 'vitest';
import { resolveFileEntityMapperConcurrency } from './core.service';

describe('file entity mapper writer concurrency', () => {
	it('defaults to one SQLite writer', () => {
		expect(resolveFileEntityMapperConcurrency(undefined)).toBe(1);
		expect(resolveFileEntityMapperConcurrency('invalid')).toBe(1);
	});

	it('keeps the explicit override inside the audited bound', () => {
		expect(resolveFileEntityMapperConcurrency('2')).toBe(2);
		expect(resolveFileEntityMapperConcurrency('0')).toBe(1);
		expect(resolveFileEntityMapperConcurrency('99')).toBe(4);
	});
});
