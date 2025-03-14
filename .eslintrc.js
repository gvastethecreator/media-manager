module.exports = {
	root: true,
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:jsx-a11y/recommended',
		'next/core-web-vitals',
		'prettier', // Debe ir al final para evitar conflictos
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['react', 'react-hooks', '@typescript-eslint', 'jsx-a11y', 'import', 'prettier'],
	settings: {
		react: {
			version: 'detect',
		},
	},
	rules: {
		// Reglas generales
		'no-console': 'warn',
		'no-unused-vars': 'off', // Desactivada en favor de @typescript-eslint/no-unused-vars
		'prefer-const': 'error',
		'react/react-in-jsx-scope': 'off', // No necesario en React 17+
		'react/prop-types': 'off', // No necesario con TypeScript

		// Reglas TypeScript
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/no-non-null-assertion': 'error',
		'@typescript-eslint/explicit-module-boundary-types': 'off',

		// Reglas React
		'react/self-closing-comp': 'error',
		'react/no-array-index-key': 'error',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'error',

		// Reglas a11y
		'jsx-a11y/anchor-is-valid': 'error',
		'jsx-a11y/alt-text': 'error',
		'jsx-a11y/click-events-have-key-events': 'error',
		'jsx-a11y/no-autofocus': 'off',

		// Reglas de formato
		'prettier/prettier': 'error',
	},
	overrides: [
		// Permitir console.log en archivos de prueba
		{
			files: ['**/*.test.ts', '**/*.test.tsx'],
			rules: {
				'no-console': 'off',
			},
		},
		// Permitir exportaciones por defecto en archivos de Next.js
		{
			files: ['**/app/**/*.tsx', '**/app/**/*.ts', '**/app/api/**/*.ts'],
			rules: {
				'import/no-default-export': 'off',
			},
		},
	],
	ignorePatterns: [
		'**/node_modules/**',
		'**/dist/**',
		'**/build/**',
		'**/.next/**',
		'**/coverage/**',
		'**/*.min.js',
		'**/public/**',
		'**/.vercel/**',
		'**/.git/**',
		'prisma/**',
	],
};
