import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
	it('reads matchMedia and returns a boolean', () => {
		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(false);
	});
});
