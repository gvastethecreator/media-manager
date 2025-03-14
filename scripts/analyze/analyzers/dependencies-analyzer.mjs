/**
 * Analizador de dependencias
 * @module dependencies-analyzer
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analiza las dependencias del proyecto
 * @returns {Promise<Object>} Resultados del análisis
 */
export async function analyzeDependencies() {
	try {
		const projectRoot = path.resolve(__dirname, '../../../');
		const packageJsonPath = path.join(projectRoot, 'package.json');

		// Estructura base del resultado
		const dependenciesResults = {
			dependencies: {
				total: 0,
				direct: 0,
				dev: 0,
				peer: 0,
				outdated: 0,
			},
			versions: {
				node: process.version,
				npm: '',
				dependencies: {},
			},
			security: {
				vulnerabilities: [],
				total: 0,
				high: 0,
				medium: 0,
				low: 0,
			},
			licenses: {
				compatible: [],
				incompatible: [],
				unknown: [],
			},
			updates: {
				available: [],
				breaking: [],
				recommended: [],
			},
			healthScore: 0,
			updatesAvailable: 0,
			vulnerabilities: 0,
			licenseIssues: 0,
		};

		// Leer package.json
		const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
		const dependencies = packageJson.dependencies || {};
		const devDependencies = packageJson.devDependencies || {};
		const peerDependencies = packageJson.peerDependencies || {};

		// Contar dependencias
		dependenciesResults.dependencies.direct = Object.keys(dependencies).length;
		dependenciesResults.dependencies.dev = Object.keys(devDependencies).length;
		dependenciesResults.dependencies.peer = Object.keys(peerDependencies).length;
		dependenciesResults.dependencies.total =
			dependenciesResults.dependencies.direct +
			dependenciesResults.dependencies.dev +
			dependenciesResults.dependencies.peer;

		// Obtener versión de pnpm
		try {
			const { stdout } = await execAsync('pnpm -v');
			dependenciesResults.versions.npm = stdout.trim();
		} catch (error) {
			console.error('Error al obtener la versión de pnpm:', error);
		}

		// Analizar dependencias desactualizadas
		try {
			const { stdout } = await execAsync('pnpm outdated --json', { cwd: projectRoot });
			const outdated = JSON.parse(stdout || '{}');

			for (const [name, info] of Object.entries(outdated)) {
				const update = {
					name,
					current: info.current,
					wanted: info.wanted,
					latest: info.latest,
					type: info.type || 'dependencies',
				};

				dependenciesResults.updates.available.push(update);

				if (isBreakingChange(info.current, info.latest)) {
					dependenciesResults.updates.breaking.push(update);
				}

				if (shouldUpdate(info.current, info.latest)) {
					dependenciesResults.updates.recommended.push(update);
				}
			}

			dependenciesResults.dependencies.outdated = Object.keys(outdated).length;
			dependenciesResults.updatesAvailable = dependenciesResults.dependencies.outdated;
		} catch (error) {
			if (!error.stdout) {
				console.error('Error al verificar dependencias desactualizadas:', error);
			}
		}

		// Analizar vulnerabilidades
		try {
			const { stdout } = await execAsync('pnpm audit --json', { cwd: projectRoot });
			const audit = JSON.parse(stdout);

			if (audit.vulnerabilities) {
				for (const [name, info] of Object.entries(audit.vulnerabilities)) {
					dependenciesResults.security.vulnerabilities.push({
						name,
						severity: info.severity,
						via: info.via,
						effects: info.effects,
						range: info.range,
						nodes: info.nodes,
						fixAvailable: info.fixAvailable,
					});

					dependenciesResults.security[info.severity]++;
					dependenciesResults.security.total++;
				}
			}

			dependenciesResults.vulnerabilities = dependenciesResults.security.total;
		} catch (error) {
			console.warn(
				'⚠️ No se pudo realizar el análisis de vulnerabilidades. Esto es normal si no existe un archivo pnpm-lock.yaml'
			);
		}

		// Analizar licencias
		for (const deps of [dependencies, devDependencies]) {
			for (const [name, version] of Object.entries(deps)) {
				try {
					const packagePath = path.join(projectRoot, 'node_modules', name, 'package.json');
					const depPackage = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
					const license = depPackage.license || 'UNKNOWN';

					if (isCompatibleLicense(license)) {
						dependenciesResults.licenses.compatible.push({ name, license });
					} else if (license === 'UNKNOWN') {
						dependenciesResults.licenses.unknown.push({ name, license });
					} else {
						dependenciesResults.licenses.incompatible.push({ name, license });
					}
				} catch (error) {
					console.error(`Error al analizar licencia de ${name}:`, error);
					dependenciesResults.licenses.unknown.push({ name, license: 'ERROR' });
				}
			}
		}

		dependenciesResults.licenseIssues =
			dependenciesResults.licenses.incompatible.length + dependenciesResults.licenses.unknown.length;

		// Calcular puntuación de salud
		dependenciesResults.healthScore = calculateHealthScore(dependenciesResults);

		return dependenciesResults;
	} catch (error) {
		console.error('Error al analizar dependencias:', error);
		return {
			dependencies: {
				total: 0,
				direct: 0,
				dev: 0,
				peer: 0,
				outdated: 0,
			},
			versions: {
				node: process.version,
				npm: '',
				dependencies: {},
			},
			security: {
				vulnerabilities: [],
				total: 0,
				high: 0,
				medium: 0,
				low: 0,
			},
			licenses: {
				compatible: [],
				incompatible: [],
				unknown: [],
			},
			updates: {
				available: [],
				breaking: [],
				recommended: [],
			},
			healthScore: 0,
			updatesAvailable: 0,
			vulnerabilities: 0,
			licenseIssues: 0,
		};
	}
}

/**
 * Verifica si una licencia es compatible
 * @param {string} license - Licencia a verificar
 * @returns {boolean} True si la licencia es compatible
 */
function isCompatibleLicense(license) {
	const compatibleLicenses = [
		'MIT',
		'ISC',
		'BSD',
		'Apache',
		'CC0',
		'Unlicense',
		'BSD-2-Clause',
		'BSD-3-Clause',
		'Apache-2.0',
	];

	return compatibleLicenses.some((l) => license.includes(l));
}

/**
 * Verifica si hay un cambio de versión mayor
 * @param {string} current - Versión actual
 * @param {string} latest - Última versión
 * @returns {boolean} True si hay un cambio mayor
 */
function isBreakingChange(current, latest) {
	const [currentMajor] = current.split('.');
	const [latestMajor] = latest.split('.');
	return parseInt(currentMajor) < parseInt(latestMajor);
}

/**
 * Verifica si se recomienda actualizar
 * @param {string} current - Versión actual
 * @param {string} latest - Última versión
 * @returns {boolean} True si se recomienda actualizar
 */
function shouldUpdate(current, latest) {
	const [currentMajor, currentMinor] = current.split('.');
	const [latestMajor, latestMinor] = latest.split('.');

	// Actualizar si hay una versión menor nueva
	return parseInt(currentMajor) === parseInt(latestMajor) && parseInt(currentMinor) < parseInt(latestMinor);
}

/**
 * Calcula la puntuación de salud de las dependencias
 * @param {Object} results - Resultados del análisis
 * @returns {number} Puntuación de 0 a 100
 */
function calculateHealthScore(results) {
	let score = 100;

	// Penalizar por vulnerabilidades
	if (results.security.high > 0) score -= 30;
	if (results.security.medium > 0) score -= 20;
	if (results.security.low > 0) score -= 10;

	// Penalizar por dependencias desactualizadas
	const outdatedRatio = results.dependencies.outdated / results.dependencies.total;
	score -= outdatedRatio * 20;

	// Penalizar por problemas de licencias
	const licenseIssuesRatio = results.licenseIssues / results.dependencies.total;
	score -= licenseIssuesRatio * 20;

	return Math.max(0, Math.min(100, Math.round(score)));
}

export default {
	analyzeDependencies,
};
