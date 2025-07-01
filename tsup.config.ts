import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/server/index.ts'],
	sourcemap: true,
	outDir: 'dist/server',
	target: 'node22',
	format: 'esm',
	minify: false,
	dts: false,
});
