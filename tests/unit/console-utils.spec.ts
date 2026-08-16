import { describe, expect, it, vi } from 'vitest';

// Mock clientLogger
const mockClientLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
	withContext: vi.fn().mockReturnThis(),
};

// Mock the client-logger module
vi.mock('@/lib/logger/client-logger', () => ({
	clientLogger: mockClientLogger,
}));

// Import after mocking
const {
	consoleUtils: cu,
	createContextLogger: ccl,
	debug: d,
	error: e,
	info: i,
	log: l,
	restore: r,
	silence: s,
	warn: w,
} = await import('@/lib/utils/console-utils');

describe('console-utils', () => {
	describe('silence y restore', () => {
		it('debe silenciar console.log después de llamar a silence', () => {
			const mockLog = vi.fn();
			console.log = mockLog;
			s();
			console.log('test');
			expect(mockLog).not.toHaveBeenCalled();
		});

		it('debe restaurar console.log después de llamar a restore', () => {
			const mockLog = vi.fn();
			console.log = mockLog;
			s();
			r();
			// After restore, console.log should be the original function
			expect(typeof console.log).toBe('function');
		});

		it('mantiene console.error funcional incluso en silence', () => {
			const mockError = vi.fn();
			console.error = mockError;
			s();
			console.error('test error');
			// console.error no debería ser silenciado por la implementación
			expect(mockError).toHaveBeenCalled();
		});
	});

	describe('consoleUtils namespace', () => {
		it('debe exportar todas las funciones en el namespace', () => {
			expect(cu.log).toBe(l);
			expect(cu.warn).toBe(w);
			expect(cu.error).toBe(e);
			expect(cu.debug).toBe(d);
			expect(cu.info).toBe(i);
			expect(cu.createContextLogger).toBe(ccl);
			expect(cu.silence).toBe(s);
			expect(cu.restore).toBe(r);
		});
	});

	describe('funciones exportadas', () => {
		it('log debe ser una función', () => {
			expect(typeof l).toBe('function');
		});

		it('warn debe ser una función', () => {
			expect(typeof w).toBe('function');
		});

		it('error debe ser una función', () => {
			expect(typeof e).toBe('function');
		});

		it('debug debe ser una función', () => {
			expect(typeof d).toBe('function');
		});

		it('info debe ser una función', () => {
			expect(typeof i).toBe('function');
		});

		it('createContextLogger debe ser una función', () => {
			expect(typeof ccl).toBe('function');
		});

		it('silence debe ser una función', () => {
			expect(typeof s).toBe('function');
		});

		it('restore debe ser una función', () => {
			expect(typeof r).toBe('function');
		});
	});

	describe('createContextLogger', () => {
		it('debe retornar un objeto con métodos de logging', () => {
			const contextLogger = ccl('TestContext');

			expect(typeof contextLogger.log).toBe('function');
			expect(typeof contextLogger.warn).toBe('function');
			expect(typeof contextLogger.error).toBe('function');
			expect(typeof contextLogger.debug).toBe('function');
		});
	});
});
