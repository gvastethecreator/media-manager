import { describe, expect, it } from 'vitest';
import { shouldForceViteOptimizeDeps } from './vite-dev-optimize';

describe('shouldForceViteOptimizeDeps', () => {
	it('does not force Vite dep re-optimization in development', () => {
		expect(shouldForceViteOptimizeDeps('development')).toBe(false);
		expect(shouldForceViteOptimizeDeps('production')).toBe(false);
		expect(shouldForceViteOptimizeDeps('test')).toBe(false);
	});
});
