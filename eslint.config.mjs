// @ts-check
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
});

// Configuraciones específicas para plugins
const reactConfig = {
	settings: {
		react: {
			version: 'detect',
		},
	},
	rules: {
		'react/react-in-jsx-scope': 'off',
	},
};

export default [
	js.configs.recommended,
	{
		ignores: [
			'**/node_modules/**',
			'**/.next/**',
			'**/dist/**',
			'**/build/**',
			'**/coverage/**',
			'**/*.config.js',
			'**/public/**',
			'scripts/**/*.mjs', // Ignorar los scripts de análisis
		],
	},
	// TypeScript
	...compat.config({
		extends: ['plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'next/core-web-vitals', 'prettier'],
	}),
	// React Hooks
	{
		plugins: {
			'react-hooks': reactHooks,
		},
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
	// React
	reactConfig,
	// TypeScript configuración específica
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
	// JS/JSX configuración
	{
		files: ['**/*.{js,mjs,cjs,jsx}'],
		languageOptions: {
			ecmaVersion: 2024,
			sourceType: 'module',
		},
	},
];
