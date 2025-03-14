/**
 * Analizador de linting
 * @module linting-analyzer
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { simplifyPath } from '../utils.mjs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verifica la existencia de archivos de configuración de ESLint
 * @param {string} projectRoot - Ruta raíz del proyecto
 * @returns {Promise<string|null>} Ruta del archivo de configuración encontrado o null
 */
async function findEslintConfig(projectRoot) {
	const configFiles = [
		'.eslintrc.js',
		'.eslintrc.cjs',
		'.eslintrc.yaml',
		'.eslintrc.yml',
		'.eslintrc.json',
		'.eslintrc',
		'eslint.config.js', // ESLint 9 flat config
		'package.json', // También puede estar en package.json
	];

	for (const file of configFiles) {
		const configPath = path.join(projectRoot, file);
		try {
			await fs.access(configPath);
			if (file === 'package.json') {
				// Verificar si package.json contiene configuración de ESLint
				const content = await fs.readFile(configPath, 'utf-8');
				const pkg = JSON.parse(content);
				if (pkg.eslintConfig) {
					return configPath;
				}
			} else {
				return configPath;
			}
		} catch (error) {
			// Archivo no existe, continuar con el siguiente
			continue;
		}
	}
	return null;
}

/**
 * Analiza los problemas de linting del proyecto
 * @returns {Promise<Object>} Resultados del análisis
 */
export async function analyzeLinting() {
	try {
		const projectRoot = path.resolve(__dirname, '../../../');

		// Resultados del análisis
		const lintingResults = {
			eslint: {
				errors: [],
				warnings: [],
				summary: {
					totalErrors: 0,
					totalWarnings: 0,
					fileCount: 0,
					errorsByType: {},
					warningsByType: {},
					configurationStatus: 'success',
				},
			},
			typescript: {
				errors: [],
				warnings: [],
				summary: {
					totalErrors: 0,
					totalWarnings: 0,
					fileCount: 0,
					errorsByType: {},
				},
			},
		};

		// Ejecutar ESLint
		try {
			// Primero verificamos si ESLint está configurado correctamente
			try {
				await execAsync('npx eslint --version', { cwd: projectRoot });
			} catch (versionError) {
				lintingResults.eslint.summary.configurationStatus = 'not-installed';
				console.warn('ESLint no está instalado correctamente:', versionError.message);
				return lintingResults;
			}

			// Verificar la existencia de cualquier archivo de configuración de ESLint
			const eslintConfigPath = await findEslintConfig(projectRoot);
			if (!eslintConfigPath) {
				lintingResults.eslint.summary.configurationStatus = 'not-configured';
				console.warn('No se encontró ningún archivo de configuración de ESLint');

				// Crear configuración básica para ESLint 9
				const basicConfig = `// @ts-check

export default [
	{
		files: ['**/*.js', '**/*.mjs', '**/*.jsx', '**/*.ts', '**/*.tsx'],
		languageOptions: {
			ecmaVersion: 2024,
			sourceType: 'module',
			parser: await import('@typescript-eslint/parser'),
			parserOptions: {
				project: './tsconfig.json'
			},
		},
		plugins: {
			'@typescript-eslint': await import('@typescript-eslint/eslint-plugin'),
			'react': await import('eslint-plugin-react'),
			'react-hooks': await import('eslint-plugin-react-hooks'),
		},
		settings: {
			react: {
				version: 'detect'
			}
		},
		rules: {
			'no-unused-vars': 'warn',
			'no-console': 'warn',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'react/react-in-jsx-scope': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn'
		}
	},
	{
		ignores: [
			'**/node_modules/**',
			'**/.next/**',
			'**/dist/**',
			'**/build/**',
			'**/coverage/**',
			'**/*.config.js',
			'**/public/**'
		]
	}
];`;

				await fs.writeFile(path.join(projectRoot, 'eslint.config.mjs'), basicConfig);
				console.log('✅ Creada configuración básica de ESLint 9 en eslint.config.mjs');
			}

			// Intentar ejecutar ESLint
			try {
				const { stdout } = await execAsync('npx eslint . --format json', {
					cwd: projectRoot,
					env: {
						...process.env,
						ESLINT_USE_FLAT_CONFIG: 'true',
						NODE_OPTIONS: '--experimental-vm-modules',
					},
				});

				if (stdout.trim()) {
					const eslintResults = JSON.parse(stdout);

					// Procesar resultados
					for (const result of eslintResults) {
						if (result.messages.length > 0) {
							lintingResults.eslint.summary.fileCount++;

							for (const message of result.messages) {
								const issue = {
									file: simplifyPath(result.filePath),
									line: message.line,
									column: message.column,
									message: message.message,
									ruleId: message.ruleId || 'unknown',
								};

								if (message.severity === 2) {
									lintingResults.eslint.errors.push(issue);
									lintingResults.eslint.summary.totalErrors++;
									lintingResults.eslint.summary.errorsByType[issue.ruleId] =
										(lintingResults.eslint.summary.errorsByType[issue.ruleId] || 0) + 1;
								} else {
									lintingResults.eslint.warnings.push(issue);
									lintingResults.eslint.summary.totalWarnings++;
									lintingResults.eslint.summary.warningsByType[issue.ruleId] =
										(lintingResults.eslint.summary.warningsByType[issue.ruleId] || 0) + 1;
								}
							}
						}
					}
				}
			} catch (error) {
				console.warn('Error al ejecutar ESLint:', error.message);
				lintingResults.eslint.summary.configurationStatus = 'error';
			}
		} catch (error) {
			console.warn('Error al ejecutar ESLint:', error.message);
			lintingResults.eslint.summary.configurationStatus = 'error';
		}

		// Ejecutar TypeScript
		try {
			const { stdout, stderr } = await execAsync('npx tsc --noEmit', { cwd: projectRoot });

			if (stderr) {
				// Analizar errores de TypeScript
				const lines = stderr.split('\n');
				const errorRegex = /(.+)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)/;

				for (const line of lines) {
					const match = line.match(errorRegex);

					if (match) {
						const [, filePath, lineNum, column, level, code, message] = match;

						const issue = {
							file: simplifyPath(filePath),
							line: parseInt(lineNum, 10),
							column: parseInt(column, 10),
							message,
							code: `TS${code}`,
						};

						if (level === 'error') {
							lintingResults.typescript.errors.push(issue);
							lintingResults.typescript.summary.totalErrors++;
							lintingResults.typescript.summary.errorsByType[issue.code] =
								(lintingResults.typescript.summary.errorsByType[issue.code] || 0) + 1;
						} else {
							lintingResults.typescript.warnings.push(issue);
							lintingResults.typescript.summary.totalWarnings++;
						}
					}
				}

				// Contar archivos únicos con errores
				const uniqueFiles = new Set(lintingResults.typescript.errors.map((err) => err.file));
				lintingResults.typescript.summary.fileCount = uniqueFiles.size;
			}
		} catch (error) {
			// TypeScript devuelve código de error cuando hay errores de tipo
			if (error.stderr) {
				// Analizar errores de TypeScript
				const lines = error.stderr.split('\n');
				const errorRegex = /(.+)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)/;

				for (const line of lines) {
					const match = line.match(errorRegex);

					if (match) {
						const [, filePath, lineNum, column, level, code, message] = match;

						const issue = {
							file: simplifyPath(filePath),
							line: parseInt(lineNum, 10),
							column: parseInt(column, 10),
							message,
							code: `TS${code}`,
						};

						if (level === 'error') {
							lintingResults.typescript.errors.push(issue);
							lintingResults.typescript.summary.totalErrors++;
							lintingResults.typescript.summary.errorsByType[issue.code] =
								(lintingResults.typescript.summary.errorsByType[issue.code] || 0) + 1;
						} else {
							lintingResults.typescript.warnings.push(issue);
							lintingResults.typescript.summary.totalWarnings++;
						}
					}
				}

				// Contar archivos únicos con errores
				const uniqueFiles = new Set(lintingResults.typescript.errors.map((err) => err.file));
				lintingResults.typescript.summary.fileCount = uniqueFiles.size;
			}
		}

		return lintingResults;
	} catch (error) {
		console.error('Error al analizar el linting:', error);
		// Devolver un objeto válido incluso en caso de error
		return {
			eslint: {
				errors: [],
				warnings: [],
				summary: {
					totalErrors: 0,
					totalWarnings: 0,
					fileCount: 0,
					errorsByType: {},
					warningsByType: {},
					configurationStatus: 'error',
				},
			},
			typescript: {
				errors: [],
				warnings: [],
				summary: {
					totalErrors: 0,
					totalWarnings: 0,
					fileCount: 0,
					errorsByType: {},
				},
			},
		};
	}
}

export default {
	analyzeLinting,
};
