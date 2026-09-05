import { describe, expect, it } from 'vitest';
import * as hooks from '@/hooks';

describe('hooks barrel', () => {
	it('does not export the unused client undo helper', () => {
		expect(hooks).not.toHaveProperty('useUndo');
		expect(hooks).toHaveProperty('useMove');
		expect(hooks).toHaveProperty('useIsMobile');
	});
});
