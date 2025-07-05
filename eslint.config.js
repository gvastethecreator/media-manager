import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				// Node.js globals
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',

				// Browser globals
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				localStorage: 'readonly',
				sessionStorage: 'readonly',
				fetch: 'readonly',
				alert: 'readonly',
				confirm: 'readonly',
				prompt: 'readonly',
				crypto: 'readonly',
				performance: 'readonly',

				// Timing functions
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',

				// DOM types
				HTMLElement: 'readonly',
				HTMLDivElement: 'readonly',
				HTMLButtonElement: 'readonly',
				HTMLInputElement: 'readonly',
				HTMLImageElement: 'readonly',
				HTMLCanvasElement: 'readonly',
				HTMLSelectElement: 'readonly',
				HTMLTextAreaElement: 'readonly',
				HTMLParagraphElement: 'readonly',
				HTMLHeadingElement: 'readonly',
				HTMLSpanElement: 'readonly',
				HTMLAudioElement: 'readonly',

				// Events
				MouseEvent: 'readonly',
				KeyboardEvent: 'readonly',
				Event: 'readonly',
				CustomEvent: 'readonly',

				// Web APIs
				URL: 'readonly',
				URLSearchParams: 'readonly',
				FormData: 'readonly',
				FileList: 'readonly',
				File: 'readonly',
				Blob: 'readonly',
				FileReader: 'readonly',
				Image: 'readonly',
				Headers: 'readonly',
				Request: 'readonly',
				Response: 'readonly',

				// Observers
				ResizeObserver: 'readonly',
				IntersectionObserver: 'readonly',
				MutationObserver: 'readonly',

				// Streams
				ReadableStream: 'readonly',
				WritableStreamDefaultWriter: 'readonly',
				TransformStream: 'readonly',
				CanvasRenderingContext2D: 'readonly',

				// Other APIs
				ClipboardItem: 'readonly',
				EventListener: 'readonly',
				MediaQueryListEvent: 'readonly',
				TextEncoder: 'readonly',
				Element: 'readonly',
				Node: 'readonly',

				// Testing globals (for Vitest)
				vi: 'readonly',
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				test: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
		},
		rules: {
			// Reglas que complementan Biome (no duplican su funcionalidad)

			// TypeScript específicas que Biome no cubre completamente
			'@typescript-eslint/no-unused-vars': 'off', // Biome ya maneja esta regla
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/prefer-as-const': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',

			// Reglas generales que complementan Biome
			'no-console': 'off',
			'no-debugger': 'error',
			'no-alert': 'error',
			'prefer-const': 'error',
			'no-var': 'off',
			'no-unused-vars': 'off', // Biome ya maneja esta regla
			'no-undef': 'error', // Activamos esta regla para detectar variables no definidas

			// Desactivar reglas que Biome ya maneja
			indent: 'off',
			quotes: 'off',
			semi: 'off',
			'comma-dangle': 'off',
			'object-curly-spacing': 'off',
			'array-bracket-spacing': 'off',
			'space-before-function-paren': 'off',
			'keyword-spacing': 'off',
			'space-infix-ops': 'off',
			'eol-last': 'off',
			'no-trailing-spaces': 'off',
			'max-len': 'off',
		},
	},
	{
		files: ['**/*.js'],
		rules: {
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'build/**',
			'coverage/**',
			'.turbo/**',
			'logs/**',
			'public/**',
			'*.config.js',
			'*.config.ts',
			'scripts/**',
			'prisma/migrations/**',
			'test-results/**',
			'playwright-report/**',
			'~/',
		],
	},
];
