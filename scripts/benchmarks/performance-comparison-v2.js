#!/usr/bin/env bun

/**
 * Script de Benchmarks MEJORADO para FASE 2: Optimización Híbrida
 * Compara rendimiento Node.js vs Bun con compatibilidad ES modules
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

const BENCHMARK_RESULTS_DIR = 'logs/benchmarks';
const ITERATIONS = 3; // Reducido para mayor velocidad

// Asegurar que el directorio de logs existe
await fs.mkdir(BENCHMARK_RESULTS_DIR, { recursive: true });

class BenchmarkRunnerV2 {
	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			node_version: null,
			bun_version: null,
			benchmarks: {},
			system_info: {
				platform: process.platform,
				arch: process.arch,
				cpus: process.env.NUMBER_OF_PROCESSORS || 'unknown',
			},
		};
	}

	async getVersions() {
		try {
			// Obtener versión de Node.js
			const nodeVersion = await this.runCommand('node', ['--version']);
			this.results.node_version = nodeVersion.trim();

			// Obtener versión de Bun
			const bunVersion = await this.runCommand('bun', ['--version']);
			this.results.bun_version = bunVersion.trim();

			console.log(chalk.blue('🔍 Versiones detectadas:'));
			console.log(`   Node.js: ${this.results.node_version}`);
			console.log(`   Bun: ${this.results.bun_version}`);
			console.log(`   Platform: ${this.results.system_info.platform} ${this.results.system_info.arch}`);
		} catch (error) {
			console.error('Error obteniendo versiones:', error.message);
		}
	}

	async runCommand(command, args = [], options = {}) {
		return new Promise((resolve, reject) => {
			const child = spawn(command, args, {
				stdio: ['pipe', 'pipe', 'pipe'],
				shell: true,
				...options,
			});

			let stdout = '';
			let stderr = '';

			child.stdout?.on('data', (data) => {
				stdout += data.toString();
			});

			child.stderr?.on('data', (data) => {
				stderr += data.toString();
			});

			child.on('close', (code) => {
				if (code === 0) {
					resolve(stdout);
				} else {
					reject(new Error(`Command failed with code ${code}: ${stderr}`));
				}
			});
		});
	}

	async createTempScript(filename, content, isESModule = true) {
		const extension = isESModule ? '.mjs' : '.cjs';
		const tempScript = path.join(process.cwd(), `${filename}${extension}`);
		await fs.writeFile(tempScript, content);
		return tempScript;
	}

	async benchmarkStartupTime(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'node';

		// Script simple para startup
		const content = 'console.log("Hello World");';
		const tempScript = await this.createTempScript('temp-benchmark-startup', content, false);

		for (let i = 0; i < ITERATIONS; i++) {
			const start = performance.now();
			try {
				await this.runCommand(command, [tempScript]);
				const end = performance.now();
				times.push(end - start);
			} catch (error) {
				console.error(`Error en iteración ${i + 1} para ${runtime}:`, error.message);
			}
		}

		// Limpiar archivo temporal
		await fs.unlink(tempScript).catch(() => {});

		return this.calculateStats(times);
	}

	async benchmarkDependencyResolution(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'node';

		// Script para resolución de dependencias (CommonJS)
		const content = `
const start = performance.now();
require('react');
require('express');
require('lodash');
const end = performance.now();
console.log(end - start);
`;
		const tempScript = await this.createTempScript('temp-benchmark-deps', content, false);

		for (let i = 0; i < ITERATIONS; i++) {
			try {
				const result = await this.runCommand(command, [tempScript]);
				const time = Number.parseFloat(result.trim());
				if (!Number.isNaN(time)) {
					times.push(time);
				}
			} catch (error) {
				console.error(`Error en resolución de dependencias ${runtime}:`, error.message);
			}
		}

		// Limpiar archivo temporal
		await fs.unlink(tempScript).catch(() => {});

		return this.calculateStats(times);
	}

	async benchmarkFileOperations(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'node';

		// Script para operaciones de archivo (CommonJS)
		const content = `
const fs = require('fs/promises');
const path = require('path');

(async () => {
	try {
		const start = performance.now();
		
		// Crear archivo temporal
		const tempFile = path.join(process.cwd(), 'temp-benchmark.txt');
		await fs.writeFile(tempFile, 'Test content for benchmark');
		
		// Leer archivo
		const content = await fs.readFile(tempFile, 'utf8');
		
		// Eliminar archivo
		await fs.unlink(tempFile);
		
		const end = performance.now();
		console.log(end - start);
	} catch (error) {
		console.error('Error:', error.message);
	}
})();
`;
		const tempScript = await this.createTempScript('temp-benchmark-files', content, false);

		for (let i = 0; i < ITERATIONS; i++) {
			try {
				const result = await this.runCommand(command, [tempScript]);
				const time = Number.parseFloat(result.trim());
				if (!Number.isNaN(time)) {
					times.push(time);
				}
			} catch (error) {
				console.error(`Error en operaciones de archivo ${runtime}:`, error.message);
			}
		}

		// Limpiar archivo temporal
		await fs.unlink(tempScript).catch(() => {});

		return this.calculateStats(times);
	}

	async benchmarkPackageManager(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'npm';

		console.log(chalk.yellow(`⏱️  Ejecutando benchmark de package manager con ${runtime}...`));

		// Test simple: verificar dependencias instaladas
		for (let i = 0; i < 2; i++) {
			try {
				const start = performance.now();

				if (runtime === 'bun') {
					await this.runCommand('bun', ['install', '--dry-run']);
				} else {
					await this.runCommand('npm', ['list', '--depth=0']);
				}

				const end = performance.now();
				times.push(end - start);
				console.log(chalk.green(`   Iteración ${i + 1}: ${(end - start).toFixed(2)}ms`));
			} catch (error) {
				console.error(`Error en package manager ${runtime}:`, error.message);
			}
		}

		return this.calculateStats(times);
	}

	calculateStats(times) {
		if (times.length === 0) {
			return {
				average: 0,
				min: 0,
				max: 0,
				times: [],
				valid: false,
			};
		}

		return {
			average: times.reduce((a, b) => a + b, 0) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			times,
			valid: true,
		};
	}

	async runAllBenchmarks() {
		console.log(chalk.blue.bold('🚀 BENCHMARKS FASE 2 V2: Node.js vs Bun (Mejorado)'));
		console.log('='.repeat(70));

		await this.getVersions();

		// Benchmark 1: Startup Time
		console.log(chalk.yellow('\n⚡ Benchmark 1: Tiempo de Inicio'));
		this.results.benchmarks.startup = {
			bun: await this.benchmarkStartupTime('bun'),
			node: await this.benchmarkStartupTime('node'),
		};

		// Benchmark 2: Dependency Resolution
		console.log(chalk.yellow('\n📦 Benchmark 2: Resolución de Dependencias'));
		this.results.benchmarks.dependency_resolution = {
			bun: await this.benchmarkDependencyResolution('bun'),
			node: await this.benchmarkDependencyResolution('node'),
		};

		// Benchmark 3: File Operations
		console.log(chalk.yellow('\n📁 Benchmark 3: Operaciones de Archivo'));
		this.results.benchmarks.file_operations = {
			bun: await this.benchmarkFileOperations('bun'),
			node: await this.benchmarkFileOperations('node'),
		};

		// Benchmark 4: Package Manager
		console.log(chalk.yellow('\n📦 Benchmark 4: Package Manager'));
		this.results.benchmarks.package_manager = {
			bun: await this.benchmarkPackageManager('bun'),
			npm: await this.benchmarkPackageManager('npm'),
		};

		// Guardar resultados
		await this.saveResults();
		this.printSummary();
	}

	async saveResults() {
		const timestamp = new Date().toISOString().split('T')[0];
		const filename = `benchmark-v2-${timestamp}.json`;
		const filepath = path.join(BENCHMARK_RESULTS_DIR, filename);

		await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
		console.log(chalk.green(`\n💾 Resultados guardados en: ${filepath}`));
	}

	printSummary() {
		console.log(chalk.blue.bold('\n📊 RESUMEN DE RESULTADOS V2'));
		console.log('='.repeat(70));

		for (const [benchmarkName, results] of Object.entries(this.results.benchmarks)) {
			console.log(chalk.cyan(`\n${benchmarkName.toUpperCase().replace('_', ' ')}:`));

			const bunResult = results.bun;
			const nodeResult = results.node || results.npm;

			if (bunResult?.valid) {
				console.log(
					`   Bun:  ${bunResult.average.toFixed(2)}ms (min: ${bunResult.min.toFixed(2)}, max: ${bunResult.max.toFixed(2)})`
				);
			}

			if (nodeResult?.valid) {
				const label = results.npm ? 'NPM' : 'Node';
				console.log(
					`   ${label}: ${nodeResult.average.toFixed(2)}ms (min: ${nodeResult.min.toFixed(2)}, max: ${nodeResult.max.toFixed(2)})`
				);
			}

			if (bunResult?.valid && nodeResult?.valid) {
				const improvement = ((nodeResult.average - bunResult.average) / nodeResult.average) * 100;

				if (improvement > 0) {
					console.log(chalk.green(`   🚀 Bun es ${improvement.toFixed(1)}% más rápido`));
				} else {
					console.log(
						chalk.red(`   ⚠️  ${results.npm ? 'NPM' : 'Node'} es ${Math.abs(improvement).toFixed(1)}% más rápido`)
					);
				}
			}
		}

		console.log(chalk.blue('\n🎯 CHECKPOINT_1 COMPLETADO: Benchmarks documentados'));
		console.log(chalk.yellow('🔄 Siguiente: CHECKPOINT_2 - Optimización configuración Vite + Bun'));
	}
}

// Ejecutar benchmarks
const runner = new BenchmarkRunnerV2();
runner.runAllBenchmarks().catch(console.error);
