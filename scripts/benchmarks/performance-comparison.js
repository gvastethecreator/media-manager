#!/usr/bin/env bun

/**
 * Script de Benchmarks para FASE 2: Optimización Híbrida
 * Compara rendimiento Node.js vs Bun en diferentes operaciones
 */

import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';

const BENCHMARK_RESULTS_DIR = 'logs/benchmarks';
const ITERATIONS = 5;

// Asegurar que el directorio de logs existe
await fs.mkdir(BENCHMARK_RESULTS_DIR, { recursive: true });

class BenchmarkRunner {
	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			node_version: null,
			bun_version: null,
			benchmarks: {}
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
		} catch (error) {
			console.error('Error obteniendo versiones:', error.message);
		}
	}

	async runCommand(command, args = [], options = {}) {
		return new Promise((resolve, reject) => {
			const child = spawn(command, args, {
				stdio: ['pipe', 'pipe', 'pipe'],
				shell: true,
				...options
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

	async benchmarkStartupTime(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'node';
		
		// Crear archivo temporal para el test
		const tempScript = path.join(process.cwd(), 'temp-benchmark-startup.js');
		await fs.writeFile(tempScript, 'console.log("Hello World");');
		
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
		
		return {
			average: times.reduce((a, b) => a + b, 0) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			times
		};
	}

	async benchmarkDependencyResolution(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'node';
		
		// Crear archivo temporal para el test
		const tempScript = path.join(process.cwd(), 'temp-benchmark-deps.js');
		const script = `
const start = performance.now();
require('react');
require('express');
require('lodash');
const end = performance.now();
console.log(end - start);
`;
		await fs.writeFile(tempScript, script);
		
		for (let i = 0; i < ITERATIONS; i++) {
			try {
				const result = await this.runCommand(command, [tempScript]);
				const time = parseFloat(result.trim());
				if (!isNaN(time)) {
					times.push(time);
				}
			} catch (error) {
				console.error(`Error en resolución de dependencias ${runtime}:`, error.message);
			}
		}
		
		// Limpiar archivo temporal
		await fs.unlink(tempScript).catch(() => {});
		
		return {
			average: times.reduce((a, b) => a + b, 0) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			times
		};
	}

	async benchmarkFileOperations(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'node';
		
		// Crear archivo temporal para el test
		const tempScript = path.join(process.cwd(), 'temp-benchmark-files.js');
		const script = `
const fs = require('fs/promises');
const path = require('path');

(async () => {
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
})();
`;
		await fs.writeFile(tempScript, script);
		
		for (let i = 0; i < ITERATIONS; i++) {
			try {
				const result = await this.runCommand(command, [tempScript]);
				const time = parseFloat(result.trim());
				if (!isNaN(time)) {
					times.push(time);
				}
			} catch (error) {
				console.error(`Error en operaciones de archivo ${runtime}:`, error.message);
			}
		}
		
		// Limpiar archivo temporal
		await fs.unlink(tempScript).catch(() => {});
		
		return {
			average: times.reduce((a, b) => a + b, 0) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			times
		};
	}

	async benchmarkBuildTime(runtime) {
		const times = [];
		const command = runtime === 'bun' ? 'bun' : 'npm';
		const args = runtime === 'bun' ? ['run', 'build:vite'] : ['run', 'build:vite'];
		
		console.log(chalk.yellow(`⏱️  Ejecutando benchmark de build con ${runtime}...`));
		
		for (let i = 0; i < 2; i++) { // Solo 2 iteraciones para builds
			try {
				// Limpiar dist antes del build
				await fs.rm('dist', { recursive: true, force: true });
				
				const start = performance.now();
				await this.runCommand(command, args);
				const end = performance.now();
				
				times.push(end - start);
				console.log(chalk.green(`   Iteración ${i + 1}: ${(end - start).toFixed(2)}ms`));
			} catch (error) {
				console.error(`Error en build ${runtime}:`, error.message);
			}
		}
		
		return {
			average: times.reduce((a, b) => a + b, 0) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			times
		};
	}

	async runAllBenchmarks() {
		console.log(chalk.blue.bold('🚀 INICIANDO BENCHMARKS FASE 2: Node.js vs Bun'));
		console.log('='.repeat(60));
		
		await this.getVersions();
		
		// Benchmark 1: Startup Time
		console.log(chalk.yellow('\n⚡ Benchmark 1: Tiempo de Inicio'));
		this.results.benchmarks.startup = {
			bun: await this.benchmarkStartupTime('bun'),
			node: await this.benchmarkStartupTime('node')
		};
		
		// Benchmark 2: Dependency Resolution
		console.log(chalk.yellow('\n📦 Benchmark 2: Resolución de Dependencias'));
		this.results.benchmarks.dependency_resolution = {
			bun: await this.benchmarkDependencyResolution('bun'),
			node: await this.benchmarkDependencyResolution('node')
		};
		
		// Benchmark 3: File Operations
		console.log(chalk.yellow('\n📁 Benchmark 3: Operaciones de Archivo'));
		this.results.benchmarks.file_operations = {
			bun: await this.benchmarkFileOperations('bun'),
			node: await this.benchmarkFileOperations('node')
		};
		
		// Benchmark 4: Build Time
		console.log(chalk.yellow('\n🏗️  Benchmark 4: Tiempo de Build'));
		this.results.benchmarks.build_time = {
			bun: await this.benchmarkBuildTime('bun')
			// Note: Node build usa npm, que internamente puede usar bun si está configurado
		};
		
		// Guardar resultados
		await this.saveResults();
		this.printSummary();
	}

	async saveResults() {
		const filename = `benchmark-${new Date().toISOString().split('T')[0]}.json`;
		const filepath = path.join(BENCHMARK_RESULTS_DIR, filename);
		
		await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
		console.log(chalk.green(`\n💾 Resultados guardados en: ${filepath}`));
	}

	printSummary() {
		console.log(chalk.blue.bold('\n📊 RESUMEN DE RESULTADOS'));
		console.log('='.repeat(60));
		
		for (const [benchmarkName, results] of Object.entries(this.results.benchmarks)) {
			console.log(chalk.cyan(`\n${benchmarkName.toUpperCase()}:`));
			
			if (results.bun && results.node) {
				const bunAvg = results.bun.average;
				const nodeAvg = results.node.average;
				const improvement = ((nodeAvg - bunAvg) / nodeAvg * 100).toFixed(1);
				
				console.log(`   Bun:  ${bunAvg.toFixed(2)}ms`);
				console.log(`   Node: ${nodeAvg.toFixed(2)}ms`);
				
				if (improvement > 0) {
					console.log(chalk.green(`   🚀 Bun es ${improvement}% más rápido`));
				} else {
					console.log(chalk.red(`   ⚠️  Node es ${Math.abs(improvement)}% más rápido`));
				}
			} else if (results.bun) {
				console.log(`   Bun: ${results.bun.average.toFixed(2)}ms`);
			}
		}
		
		console.log(chalk.blue('\n🎯 Próximos pasos: Optimizar configuración Vite + Bun'));
	}
}

// Ejecutar benchmarks
const runner = new BenchmarkRunner();
runner.runAllBenchmarks().catch(console.error);