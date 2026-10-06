import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
	it('updates across the breakpoint and removes its listener', () => {
		const addEventListener = vi.fn();
		const removeEventListener = vi.fn();
		const media = window.matchMedia('(max-width: 767px)');
		const matchMedia = vi
			.spyOn(window, 'matchMedia')
			.mockReturnValue({ ...media, addEventListener, removeEventListener });
		const originalWidth = window.innerWidth;
		try {
			window.innerWidth = 1024;
			const { result, unmount } = renderHook(() => useIsMobile());
			expect(result.current).toBe(false);
			const onChange = addEventListener.mock.calls[0][1];
			act(() => {
				window.innerWidth = 600;
				onChange();
			});
			expect(result.current).toBe(true);
			unmount();
			expect(removeEventListener).toHaveBeenCalledWith('change', onChange);
		} finally {
			window.innerWidth = originalWidth;
			matchMedia.mockRestore();
		}
	});
});
