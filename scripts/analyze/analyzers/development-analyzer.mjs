/**
 * Analizador de entorno de desarrollo
 * @module development-analyzer
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { getAllFiles } from '../utils.mjs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analiza el entorno de desarrollo del proyecto
 * @returns {Promise<Object>} Resultados del análisis
 */
export async function analyzeDevelopment() {
	try {
		const projectRoot = path.resolve(__dirname, '../../../');

		// Resultados del análisis
		const devResults = {
			scripts: {},
			configFiles: {},
			testingSetup: {
				hasJest: false,
				testFiles: 0,
				coverage: null,
			},
			gitInfo: {
				initialized: false,
				branches: [],
				lastCommit: null,
				ignoredFiles: [],
			},
			cicd: {
				hasGithubActions: false,
				hasJenkins: false,
				hasTravis: false,
				workflows: [],
			},
		};

		// Analizar package.json
		const packageJsonPath = path.join(projectRoot, 'package.json');
		const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
		const packageJson = JSON.parse(packageJsonContent);

		// Obtener scripts
		devResults.scripts = packageJson.scripts || {};

		// Verificar archivos de configuración
		const configFiles = [
			'.eslintrc.js',
			'.eslintrc.json',
			'.eslintrc',
			'tsconfig.json',
			'jest.config.js',
			'jest.config.ts',
			'.prettierrc',
			'.prettierrc.js',
			'.prettierrc.json',
			'next.config.js',
			'next.config.mjs',
			'.babelrc',
			'babel.config.js',
			'tailwind.config.js',
			'tailwind.config.ts',
			'.env',
			'.env.local',
			'.env.development',
		];

		for (const file of configFiles) {
			const filePath = path.join(projectRoot, file);
			try {
				await fs.access(filePath);

				// Leer contenido del archivo
				const content = await fs.readFile(filePath, 'utf-8');

				devResults.configFiles[file] = {
					exists: true,
					size: Buffer.byteLength(content, 'utf-8'),
				};
			} catch (error) {
				devResults.configFiles[file] = {
					exists: false,
					size: 0,
				};
			}
		}

		// Verificar configuración de pruebas
		devResults.testingSetup.hasJest =
			devResults.configFiles['jest.config.js']?.exists ||
			devResults.configFiles['jest.config.ts']?.exists ||
			!!packageJson.jest;

		// Contar archivos de prueba (compatible con Windows)
		try {
			// En lugar de usar find y wc, usamos getAllFiles y filtramos
			const allFiles = await getAllFiles(projectRoot);
			const testFiles = allFiles.filter((file) => {
				const filename = path.basename(file);
				return filename.includes('.test.') || filename.includes('.spec.');
			});
			devResults.testingSetup.testFiles = testFiles.length;
		} catch (error) {
			console.warn('Error al contar archivos de prueba:', error.message);
			devResults.testingSetup.testFiles = 0;
		}

		// Verificar información de Git
		try {
			// Verificar si Git está inicializado
			await execAsync('git status', { cwd: projectRoot });
			devResults.gitInfo.initialized = true;

			// Obtener ramas
			const { stdout: branchesOutput } = await execAsync('git branch', { cwd: projectRoot });
			devResults.gitInfo.branches = branchesOutput
				.split('\n')
				.filter(Boolean)
				.map((branch) => branch.trim().replace(/^\*\s+/, ''));

			// Obtener último commit
			const { stdout: commitOutput } = await execAsync('git log -1 --pretty=format:"%h - %an, %ar : %s"', {
				cwd: projectRoot,
			});
			devResults.gitInfo.lastCommit = commitOutput.trim();

			// Obtener archivos ignorados
			const gitignorePath = path.join(projectRoot, '.gitignore');
			try {
				const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
				devResults.gitInfo.ignoredFiles = gitignoreContent
					.split('\n')
					.filter((line) => line.trim() && !line.startsWith('#'));
			} catch (error) {
				// .gitignore no encontrado
			}
		} catch (error) {
			// Git no inicializado o error
			devResults.gitInfo.initialized = false;
		}

		// Verificar CI/CD
		const githubDir = path.join(projectRoot, '.github');
		try {
			await fs.access(githubDir);

			const workflowsDir = path.join(githubDir, 'workflows');
			try {
				await fs.access(workflowsDir);

				const workflowFiles = await fs.readdir(workflowsDir);
				devResults.cicd.hasGithubActions = workflowFiles.length > 0;
				devResults.cicd.workflows = workflowFiles;
			} catch (error) {
				// workflows directory not found
			}
		} catch (error) {
			// .github directory not found
		}

		// Verificar Jenkins
		const jenkinsfilePath = path.join(projectRoot, 'Jenkinsfile');
		try {
			await fs.access(jenkinsfilePath);
			devResults.cicd.hasJenkins = true;
		} catch (error) {
			// Jenkinsfile not found
		}

		// Verificar Travis CI
		const travisPath = path.join(projectRoot, '.travis.yml');
		try {
			await fs.access(travisPath);
			devResults.cicd.hasTravis = true;
		} catch (error) {
			// .travis.yml not found
		}

		return devResults;
	} catch (error) {
		console.error('Error al analizar el entorno de desarrollo:', error);
		throw error;
	}
}

export default {
	analyzeDevelopment,
};
