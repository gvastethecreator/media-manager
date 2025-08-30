import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { createGenerator, remarkAutoTypeTable } from 'fumadocs-typescript';

// Evitar ejecutar lógica de Node en el navegador (process.cwd no existe en runtime del cliente)
const isNodeRuntime =
	typeof globalThis.process !== 'undefined' &&
	typeof (globalThis.process as unknown as { cwd?: unknown }).cwd === 'function';
const generator = isNodeRuntime ? createGenerator() : undefined;

export default defineConfig({
	mdxOptions: {
		// Solo habilitar el plugin cuando estamos en un entorno Node (build/SSR)
		remarkPlugins: isNodeRuntime ? [[remarkAutoTypeTable, { generator }]] : [],
	},
});

export const { docs, meta } = defineDocs({
	dir: 'content/docs',
});
