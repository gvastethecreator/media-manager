import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/server/index.ts'],
	sourcemap: true,
	outDir: 'dist/server',
	target: 'node22',
	format: 'esm',
	minify: false,
	dts: false,
	external: ['dotenv'], // Excluir dotenv del bundle
	define: {
		// Definir variables de entorno en tiempo de build
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		'process.env.API_PORT': JSON.stringify(process.env.API_PORT || '3001'),
		'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL || 'file:./db.sqlite'),
		'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001/api'),
		'process.env.CORS_ORIGIN': JSON.stringify(process.env.CORS_ORIGIN || 'http://localhost:5173'),
	},
});
