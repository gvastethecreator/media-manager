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
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
		},
		rules: {
			// Reglas que complementan Biome (no duplican su funcionalidad)

			// TypeScript específicas que Biome no cubre completamente
			'@typescript-eslint/no-unused-vars': 'off', // Biome ya maneja esta regla
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/prefer-as-const': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',

			// Reglas generales que complementan Biome
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-alert': 'error',
			'prefer-const': 'error',
			'no-var': 'off',
			'no-unused-vars': 'off', // Biome ya maneja esta regla

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
			'.next/**',
			'out/**',
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
		],
	},
];
