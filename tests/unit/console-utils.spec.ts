import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/logger/client-logger', () => ({
	clientLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
const originalConsole = { ...console };
let utilities: typeof import('@/lib/utils/console-utils');
const output = { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };
beforeEach(async () => {
	vi.resetModules();
	vi.clearAllMocks();
	Object.assign(console, output);
	utilities = await import('@/lib/utils/console-utils');
});
afterEach(() => {
	Object.assign(console, originalConsole);
	vi.unstubAllEnvs();
});
describe('console utilities', () => {
	it('silences ordinary output, preserves errors and restores captured methods', () => {
		utilities.silence();
		console.log('hidden');
		console.warn('hidden');
		console.error('visible');
		expect(output.log).not.toHaveBeenCalled();
		expect(output.warn).not.toHaveBeenCalled();
		expect(output.error).toHaveBeenCalledWith('visible');
		utilities.restore();
		console.log('restored');
		console.warn('restored warning');
		expect(output.log).toHaveBeenCalledWith('restored');
		expect(output.warn).toHaveBeenCalledWith('restored warning');
	});
	it('delegates formatted messages and arguments to the captured console', () => {
		utilities.log({ value: 2 }, { redirectToLogger: false, prefix: '[test]' }, 'detail');
		utilities.warn('warning', { redirectToLogger: false });
		utilities.error('failure', { redirectToLogger: false });
		expect(output.log).toHaveBeenCalledWith('[test] {"value":2}', 'detail');
		expect(output.warn).toHaveBeenCalledWith('warning');
		expect(output.error).toHaveBeenCalledWith('failure');
	});
	it('retains context and development-only output', () => {
		vi.stubEnv('DEV', true);
		utilities.createContextLogger('Library').log('opened');
		utilities.debug('detail', 3);
		utilities.info('ready');
		expect(output.log).toHaveBeenCalledWith('[Library] opened');
		expect(output.debug).toHaveBeenCalledWith('[DEBUG] detail', 3);
		expect(output.info).toHaveBeenCalledWith('[INFO] ready');
		vi.stubEnv('DEV', false);
		utilities.debug('hidden');
		utilities.info('hidden');
		expect(output.debug).toHaveBeenCalledTimes(1);
		expect(output.info).toHaveBeenCalledTimes(1);
	});
});
