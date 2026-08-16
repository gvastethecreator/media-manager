import { describe, expect, it } from 'vitest';
import { parseWildcardChildrenForEditor } from './create-wildcard-form';

describe('parseWildcardChildrenForEditor', () => {
	it('accepts only the legacy array-of-strings contract', () => {
		expect(parseWildcardChildrenForEditor('["alpha","beta"]')).toEqual({
			error: null,
			values: [{ value: 'alpha' }, { value: 'beta' }],
		});
	});

	it.each(['{', '{"alpha":true}', '["alpha",42]'])('blocks corrupt legacy children: %s', (children) => {
		const result = parseWildcardChildrenForEditor(children);
		expect(result.error).toContain('are damaged');
		expect(result.values).toEqual([]);
	});
});
