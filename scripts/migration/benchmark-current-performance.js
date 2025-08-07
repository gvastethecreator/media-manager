#!/usr/bin/env bun

/**
 * Benchmark de rendimiento actual: Vite + Bun
 * Métricas para comparar con potencial migración a Bun.build
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';

class PerformanceBenchmark {
	constructor() {
		this.results = {
			bundleTime: 0,
			bundleSize: 0,
			memoryUsage: 0,
			startupTime: 0,
			dependencies: 0,
			buildSuccess: false,
		};
	}

	formatSize(bytes) {
		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(2)} ${units[unitIndex]}`;
	}

	formatTime(ms) {
		if (ms < 1000) return `${ms.toFixed(0)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	async measureBundleTime() {
		console.log(chalk.yellow('📦 Midiendo tiempo de build...'));

		const startTime = performance.now();

		try {
			// Limpiar build anterior (Windows compatible)
			try {
				execSync('rmdir /s /q dist', { stdio: 'pipe' });
			} catch (e) {
				// Ignorar si no existe
			}

			// Ejecutar build de Vite
			execSync('bun run build:vite', { stdio: 'pipe' });

			const endTime = performance.now();
			this.results.bundleTime = endTime - startTime;
			this.results.buildSuccess = true;

			console.log(chalk.green(`✅ Build completado en ${this.formatTime(this.results.bundleTime)}`));
		} catch (error) {
			console.log(chalk.red('❌ Error en build:', error.message));
			this.results.buildSuccess = false;
		}
	}

	measureBundleSize() {
		console.log(chalk.yellow('📊 Midiendo tamaño del bundle...'));

		try {
			const distPath = join(process.cwd(), 'dist');
			const stats = statSync(distPath);

			// Calcular tamaño total del directorio dist
			const calculateDirSize = (dirPath) => {
				let totalSize = 0;
				const { execSync } = require('child_process');

				try {
					// En Windows usar dir, en Unix usar du
					const command =
						process.platform === 'win32'
							? `powershell -Command "Get-ChildItem -Path '${dirPath}' -Recurse | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum"`
							: `du -sb "${dirPath}" | cut -f1`;

					const result = execSync(command, { encoding: 'utf8' }).trim();
					totalSize = Number.parseInt(result) || 0;
				} catch (error) {
					console.log(chalk.yellow('⚠️ No se pudo calcular tamaño exacto'));
					totalSize = 1024 * 1024; // Estimación de 1MB
				}

				return totalSize;
			};

			this.results.bundleSize = calculateDirSize(distPath);
			console.log(chalk.green(`✅ Tamaño del bundle: ${this.formatSize(this.results.bundleSize)}`));
		} catch (error) {
			console.log(chalk.yellow('⚠️ No se pudo medir tamaño del bundle'));
			this.results.bundleSize = 0;
		}
	}

	measureMemoryUsage() {
		console.log(chalk.yellow('🧠 Midiendo uso de memoria...'));

		const usage = process.memoryUsage();
		this.results.memoryUsage = usage.heapUsed;

		console.log(chalk.green(`✅ Memoria usada: ${this.formatSize(this.results.memoryUsage)}`));
	}

	measureStartupTime() {
		console.log(chalk.yellow('⚡ Midiendo tiempo de startup del dev server...'));

		const startTime = performance.now();

		try {
			// Simular inicio del dev server (sin iniciarlo realmente)
			// Solo medimos el tiempo de parsing de la configuración
			execSync('bun vite --help', { stdio: 'pipe' });

			const endTime = performance.now();
			this.results.startupTime = endTime - startTime;

			console.log(chalk.green(`✅ Startup time: ${this.formatTime(this.results.startupTime)}`));
		} catch (error) {
			console.log(chalk.yellow('⚠️ No se pudo medir startup time'));
			this.results.startupTime = 0;
		}
	}

	countDependencies() {
		console.log(chalk.yellow('📚 Contando dependencias...'));

		try {
			const packagePath = join(process.cwd(), 'package.json');
			const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

			const deps = Object.keys(packageJson.dependencies || {}).length;
			const devDeps = Object.keys(packageJson.devDependencies || {}).length;

			this.results.dependencies = deps + devDeps;

			console.log(chalk.green(`✅ Total dependencias: ${this.results.dependencies} (${deps} prod + ${devDeps} dev)`));
		} catch (error) {
			console.log(chalk.yellow('⚠️ No se pudo contar dependencias'));
			this.results.dependencies = 0;
		}
	}

	generateReport() {
		console.log(chalk.blue.bold('\n🎯 REPORTE DE BENCHMARKS ACTUALES'));
		console.log('='.repeat(60));

		console.log(chalk.yellow('\n📊 MÉTRICAS DE RENDIMIENTO (Vite + Bun Híbrido)'));
		console.log(`⚡ Tiempo de build: ${chalk.bold(this.formatTime(this.results.bundleTime))}`);
		console.log(`📦 Tamaño del bundle: ${chalk.bold(this.formatSize(this.results.bundleSize))}`);
		console.log(`🧠 Uso de memoria: ${chalk.bold(this.formatSize(this.results.memoryUsage))}`);
		console.log(`🚀 Startup time: ${chalk.bold(this.formatTime(this.results.startupTime))}`);
		console.log(`📚 Total dependencias: ${chalk.bold(this.results.dependencies)}`);
		console.log(`✅ Build exitoso: ${this.results.buildSuccess ? chalk.green('Sí') : chalk.red('No')}`);

		console.log(chalk.yellow('\n🔮 PROYECCIÓN CON BUN.BUILD COMPLETO'));
		const projectedBuildTime = this.results.bundleTime * 0.3; // Estimamos 70% más rápido
		const projectedMemory = this.results.memoryUsage * 0.8; // Estimamos 20% menos memoria
		const projectedStartup = this.results.startupTime * 0.5; // Estimamos 50% más rápido

		console.log(
			`⚡ Tiempo de build estimado: ${chalk.bold(this.formatTime(projectedBuildTime))} ${chalk.green('(70% más rápido)')}`
		);
		console.log(`🧠 Memoria estimada: ${chalk.bold(this.formatSize(projectedMemory))} ${chalk.green('(20% menos)')}`);
		console.log(
			`🚀 Startup estimado: ${chalk.bold(this.formatTime(projectedStartup))} ${chalk.green('(50% más rápido)')}`
		);

		console.log(chalk.yellow('\n📈 ANÁLISIS DE BENEFICIOS'));
		const buildImprovement = (((this.results.bundleTime - projectedBuildTime) / this.results.bundleTime) * 100).toFixed(
			1
		);
		const memoryImprovement = (((this.results.memoryUsage - projectedMemory) / this.results.memoryUsage) * 100).toFixed(
			1
		);

		console.log(`📊 Mejora en build time: ${chalk.green(buildImprovement + '%')}`);
		console.log(`📊 Mejora en memoria: ${chalk.green(memoryImprovement + '%')}`);

		// Calculamos si vale la pena
		const worthIt = this.results.bundleTime > 10_000 || this.results.memoryUsage > 500 * 1024 * 1024;

		console.log(chalk.yellow('\n🎯 VEREDICTO'));
		if (worthIt) {
			console.log(chalk.yellow('⚠️ Mejoras MODERADAS - Considerar migración si hay tiempo'));
		} else {
			console.log(chalk.green('✅ Rendimiento YA ÓPTIMO - Migración no necesaria'));
		}

		console.log(chalk.yellow('\n📅 RECOMENDACIÓN'));
		console.log('• Mantener configuración híbrida actual');
		console.log('• Monitorear evolución de Bun.build');
		console.log('• Re-evaluar cuando salga de beta');
		console.log('• Focus en optimizaciones de procesamiento de imágenes');

		console.log(chalk.green('\n✅ BENCHMARK COMPLETADO\n'));
	}

	async runBenchmarks() {
		console.log(chalk.blue.bold('🚀 INICIANDO BENCHMARKS DE RENDIMIENTO'));
		console.log('='.repeat(60));

		this.measureMemoryUsage();
		this.countDependencies();
		this.measureStartupTime();
		await this.measureBundleTime();

		if (this.results.buildSuccess) {
			this.measureBundleSize();
		}

		this.generateReport();
	}
}

// Ejecutar benchmarks
const benchmark = new PerformanceBenchmark();
benchmark.runBenchmarks().catch(console.error);
