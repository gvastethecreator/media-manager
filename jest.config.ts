import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
	dir: './',
});

const customJestConfig: Config = {
	testEnvironment: 'jest-environment-jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	moduleNameMapper: {
		// 🎯 Path mappings
		'^@\\/(.*)$': '<rootDir>/src/$1',

		// 🌐 Next.js 15 modules con mocks
		'^next/navigation$': '<rootDir>/src/tests/__mocks__/next/navigation.ts',
		'^next/server$': require.resolve('next/server'),
		'^next/headers$': require.resolve('next/headers'),
		'^next/router$': require.resolve('next/router'),
		'^next/link$': require.resolve('next/link'),
		'^next/image$': require.resolve('next/image'),
		'^next/dynamic$': require.resolve('next/dynamic'),

		// 💾 Prisma mock
		'^@prisma/client$': '<rootDir>/src/tests/__mocks__/@prisma/client.ts',

		// 🎨 Styles como objetos
		'^.+\\.(css|sass|scss)$': 'identity-obj-proxy',

		// 🖼️ Assets como strings
		'^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/src/tests/image-mock.js',
	},
	testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],
	transform: {
		'^.+\\.(js|jsx|ts|tsx|mjs)$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.test.json',
				diagnostics: {
					ignoreCodes: [1343, 151001],
				},
				astTransformers: {
					before: [
						{
							path: 'node_modules/ts-jest-mock-import-meta',
							options: {
								metaObjectReplacement: {
									url: 'https://localhost',
									env: { NODE_ENV: 'test' },
								},
							},
						},
					],
				},
			},
		],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/tests/**/*',
		'!src/**/*.stories.{ts,tsx}',
		'!src/**/*.test.{ts,tsx}',
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/dist/', '<rootDir>/coverage/'],
	transformIgnorePatterns: [
		'/node_modules/(?!(next|@next|next/server|next/navigation|next/headers|nanoid|@testing-library/user-event))',
		'^.+\\.module\\.(css|sass|scss)$',
	],
	moduleDirectories: ['node_modules', '<rootDir>/src'],
	testEnvironmentOptions: {
		url: 'http://localhost:3000',
		customExportConditions: [''],
	},
	resolver: '<rootDir>/src/tests/resolver.js',
	verbose: true,
	detectOpenHandles: true,
	forceExit: true,
};

export default createJestConfig(customJestConfig);
