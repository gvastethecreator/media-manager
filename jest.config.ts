import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/server$': require.resolve('next/server'),
    '^next/navigation$': require.resolve('next/navigation'),
    '^next/headers$': require.resolve('next/headers'),
    '^next/router$': require.resolve('next/router'),
    '^next/link$': require.resolve('next/link'),
    '^next/image$': require.resolve('next/image'),
    '^next/dynamic$': require.resolve('next/dynamic'),
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: [1343, 151001]
      },
      astTransformers: {
        before: [
          {
            path: 'node_modules/ts-jest-mock-import-meta',
            options: {
              metaObjectReplacement: {
                url: 'https://localhost',
                env: { NODE_ENV: 'test' }
              }
            }
          }
        ]
      }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(next|@next|next/server|next/navigation|next/headers))',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    customExportConditions: [''],
  },
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
}

export default createJestConfig(customJestConfig)