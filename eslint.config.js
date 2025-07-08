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
				// React globals
				React: 'readonly',

				// Custom component globals (workaround for no-undef in TextInput)
				BaseTextInput: 'readonly',
				Label: 'readonly',
				className: 'readonly',
				disabled: 'readonly',
				error: 'readonly',
				id: 'readonly',
				label: 'readonly',
				maxLength: 'readonly',
				name: 'readonly',
				onChange: 'readonly',
				placeholder: 'readonly',
				props: 'readonly',
				required: 'readonly',
				type: 'readonly',
				value: 'readonly',
				formatDate: 'readonly',

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
				ENV: 'readonly',

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
				HTMLVideoElement: 'readonly',
				HTMLCanvasElement: 'readonly',
				HTMLSelectElement: 'readonly',
				HTMLTextAreaElement: 'readonly',
				HTMLParagraphElement: 'readonly',
				HTMLHeadingElement: 'readonly',
				HTMLSpanElement: 'readonly',
				HTMLAudioElement: 'readonly',
				Document: 'readonly',
				NodeJS: 'readonly',

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
				RequestInit: 'readonly',
				CollectionBase: 'readonly',
				FolderBase: 'readonly',
				TagBase: 'readonly',
				sql: 'readonly',

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
			'no-undef': 'off', // Desactivamos esta regla para archivos TS/TSX, ya que @typescript-eslint/parser la maneja mejor

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
			// Directorios de dependencias y build
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/coverage/**',
			'**/.turbo/**',
			'**/.vercel/**',
			'**/src-tauri/target/**',

			// Reportes y logs
			'**/logs/**',
			'**/test-results/**',
			'**/playwright-report/**',

			// Assets y configuraciones
			'**/public/**',
			'*.config.js',
			'*.config.ts',

			// Scripts y otros
			'scripts/**',
			'~/',
		],
	},
];
