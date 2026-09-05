import { describe, expect, it } from 'vitest';
import { ENTITY_DISPLAY_NAMES } from './entities';

describe('ENTITY_DISPLAY_NAMES', () => {
	it('uses English labels for every entity type', () => {
		expect(ENTITY_DISPLAY_NAMES.notes).toBe('Notes');
		expect(ENTITY_DISPLAY_NAMES.properties).toBe('Properties');
		expect(ENTITY_DISPLAY_NAMES.wildcards).toBe('Wildcards');
		expect(ENTITY_DISPLAY_NAMES.worldItems).toBe('World items');
		expect(Object.values(ENTITY_DISPLAY_NAMES).every((label) => /^[A-Za-z]/.test(label))).toBe(true);
	});
});
