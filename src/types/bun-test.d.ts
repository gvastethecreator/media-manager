declare module 'bun:test' {
	export function describe(name: string, fn: () => void | Promise<void>): void;
	export function it(name: string, fn: () => void | Promise<void>): void;
	export function test(name: string, fn: () => void | Promise<void>): void;
	export function beforeEach(fn: () => void | Promise<void>): void;
	export function afterEach(fn: () => void | Promise<void>): void;
	export function expect(received: unknown): any;
	// Minimal mock API used in our tests
	export const mock: {
		(): any;
		module: (id: string, factory: any) => void;
		restore: () => void;
	};
}
