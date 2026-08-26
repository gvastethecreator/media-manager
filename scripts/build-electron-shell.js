#!/usr/bin/env bun

import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const builds = [
	{ entry: 'electron/main/index.ts', outfile: 'electron/dist/main.cjs' },
	{ entry: 'electron/preload/index.ts', outfile: 'electron/dist/preload.cjs' },
];

mkdirSync(resolve('electron/dist'), { recursive: true });

for (const build of builds) {
	const result = await Bun.build({
		entrypoints: [resolve(build.entry)],
		external: ['electron'],
		format: 'cjs',
		naming: build.outfile.endsWith('preload.cjs') ? 'preload.cjs' : 'main.cjs',
		outdir: resolve('electron/dist'),
		target: 'node',
	});
	if (!result.success) {
		for (const log of result.logs) console.error(log);
		process.exit(1);
	}
	console.log(`built ${build.outfile}`);
}
