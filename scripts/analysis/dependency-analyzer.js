#!/usr/bin/env bun

/**
 * Analizador de Dependencias para FASE 3: Bun Bundler Nativo
 * Identifica dependencias críticas y compatibilidad para migración completa
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';

class DependencyAnalyzer {
	constructor() {
		this.packageJsonPath = path.join(process.cwd(), 'package.json');
		this.analysis = {
			timestamp: new Date().toISOString(),
			phase: 'FASE 2 - Análisis para FASE 3',
			total_dependencies: 0,
			critical_dependencies: [],
			vite_plugins: [],
			bun_compatible: [],
			requires_migration: [],
			potential_issues: [],
			recommendations: [],
		};
	}

	async loadPackageJson() {
		try {
			const content = await fs.readFile(this.packageJsonPath, 'utf8');
			return JSON.parse(content);
		} catch (error) {
			console.error('Error cargando package.json:', error.message);
			return null;
		}
	}

	analyzeCriticalDependencies(packageJson) {
		const allDeps = {
			...packageJson.dependencies,
			...packageJson.devDependencies,
		};

		this.analysis.total_dependencies = Object.keys(allDeps).length;

		// Dependencias críticas para el bundling
		const criticalPatterns = [
			'vite',
			'rollup',
			'esbuild',
			'webpack',
			'@vitejs/',
			'vite-plugin-',
			'react',
			'react-dom',
			'react-router',
			'typescript',
			'@types/',
			'tailwindcss',
			'postcss',
			'@tanstack/',
			'zustand',
			'framer-motion',
			'motion',
		];

		for (const [name, version] of Object.entries(allDeps)) {
			if (criticalPatterns.some((pattern) => name.includes(pattern))) {
				this.analysis.critical_dependencies.push({
					name,
					version,
					category: this.categorizeDependency(name),
				});
			}
		}
	}

	categorizeDependency(name) {
		if (name.includes('vite') || name.includes('rollup')) {
			return 'bundler';
		}
		if (name.includes('react')) {
			return 'framework';
		}
		if (name.includes('@types/') || name === 'typescript') {
			return 'types';
		}
		if (name.includes('tailwind') || name.includes('postcss')) {
			return 'css';
		}
		if (name.includes('plugin')) {
			return 'plugin';
		}
		return 'library';
	}

	analyzeVitePlugins() {
		// Plugins de Vite identificados en la configuración
		const vitePlugins = [
			{
				name: '@vitejs/plugin-react',
				purpose: 'React JSX transformation',
				bun_alternative: 'Built-in JSX support',
				migration_complexity: 'low',
			},
			{
				name: 'vite-tsconfig-paths',
				purpose: 'TypeScript path mapping',
				bun_alternative: 'Built-in TypeScript support',
				migration_complexity: 'low',
			},
			{
				name: 'vite-plugin-svgr',
				purpose: 'SVG as React components',
				bun_alternative: 'Custom plugin needed',
				migration_complexity: 'medium',
			},
		];

		this.analysis.vite_plugins = vitePlugins;
	}

	analyzeBunCompatibility() {
		// Dependencias que son compatibles con Bun bundler
		const bunCompatible = [
			'react',
			'react-dom',
			'react-router-dom',
			'typescript',
			'tailwindcss',
			'@tanstack/react-query',
			'zustand',
			'framer-motion',
			'motion',
			'lucide-react',
			'lodash',
			'date-fns',
			'clsx',
			'tailwind-merge',
		];

		this.analysis.bun_compatible = this.analysis.critical_dependencies
			.filter((dep) => bunCompatible.includes(dep.name))
			.map((dep) => ({
				...dep,
				status: 'fully_compatible',
			}));

		// Dependencias que requieren migración
		const requiresMigration = [
			{
				name: 'vite',
				reason: 'Replace with Bun.build()',
				complexity: 'high',
				priority: 'critical',
			},
			{
				name: '@vitejs/plugin-react',
				reason: 'Use Bun built-in JSX',
				complexity: 'low',
				priority: 'high',
			},
			{
				name: 'vite-plugin-svgr',
				reason: 'Create custom Bun plugin',
				complexity: 'medium',
				priority: 'medium',
			},
			{
				name: 'rollup',
				reason: 'Replaced by Bun bundler',
				complexity: 'high',
				priority: 'critical',
			},
		];

		this.analysis.requires_migration = requiresMigration;
	}

	identifyPotentialIssues() {
		const issues = [
			{
				category: 'HMR',
				description: 'Hot Module Replacement needs custom implementation',
				impact: 'high',
				solution: 'Implement Bun-native HMR or use file watching',
			},
			{
				category: 'CSS Processing',
				description: 'PostCSS and Tailwind integration',
				impact: 'medium',
				solution: 'Use Bun CSS plugins or external processing',
			},
			{
				category: 'Asset Handling',
				description: 'Static assets and imports',
				impact: 'medium',
				solution: 'Configure Bun asset handling',
			},
			{
				category: 'Development Server',
				description: 'Dev server with proxy and middleware',
				impact: 'high',
				solution: 'Custom dev server or use Bun.serve()',
			},
			{
				category: 'Source Maps',
				description: 'Debug support in development',
				impact: 'medium',
				solution: 'Configure Bun sourcemap generation',
			},
		];

		this.analysis.potential_issues = issues;
	}

	generateRecommendations() {
		const recommendations = [
			{
				phase: 'Pre-migration',
				actions: [
					'Create comprehensive test suite',
					'Document current Vite configuration',
					'Identify custom plugins and their alternatives',
					'Benchmark current build performance',
				],
			},
			{
				phase: 'Migration Strategy',
				actions: [
					'Start with basic Bun.build() configuration',
					'Migrate plugins one by one',
					'Implement custom HMR solution',
					'Create fallback to Vite if needed',
				],
			},
			{
				phase: 'Post-migration',
				actions: [
					'Performance comparison benchmarks',
					'Validate all features work correctly',
					'Update documentation and scripts',
					'Team training on new workflow',
				],
			},
			{
				phase: 'Risk Mitigation',
				actions: [
					'Keep Vite configuration as backup',
					'Gradual rollout to team members',
					'Monitor for performance regressions',
					'Have rollback plan ready',
				],
			},
		];

		this.analysis.recommendations = recommendations;
	}

	async runAnalysis() {
		console.log(chalk.blue.bold('🔍 ANÁLISIS DE DEPENDENCIAS PARA FASE 3'));
		console.log('='.repeat(60));

		// Cargar package.json
		console.log(chalk.yellow('\n📦 Cargando información de dependencias...'));
		const packageJson = await this.loadPackageJson();
		if (!packageJson) {
			return;
		}

		// Analizar dependencias críticas
		console.log(chalk.yellow('\n🔍 Analizando dependencias críticas...'));
		this.analyzeCriticalDependencies(packageJson);

		// Analizar plugins de Vite
		console.log(chalk.yellow('\n🔌 Analizando plugins de Vite...'));
		this.analyzeVitePlugins();

		// Analizar compatibilidad con Bun
		console.log(chalk.yellow('\n✅ Analizando compatibilidad con Bun...'));
		this.analyzeBunCompatibility();

		// Identificar problemas potenciales
		console.log(chalk.yellow('\n⚠️  Identificando problemas potenciales...'));
		this.identifyPotentialIssues();

		// Generar recomendaciones
		console.log(chalk.yellow('\n💡 Generando recomendaciones...'));
		this.generateRecommendations();

		// Guardar análisis
		await this.saveAnalysis();

		// Mostrar resumen
		this.printSummary();
	}

	async saveAnalysis() {
		const analysisPath = path.join('logs', 'dependency-analysis.json');
		await fs.mkdir(path.dirname(analysisPath), { recursive: true });
		await fs.writeFile(analysisPath, JSON.stringify(this.analysis, null, 2));
		console.log(chalk.green(`\n💾 Análisis guardado en: ${analysisPath}`));
	}

	printSummary() {
		console.log(chalk.blue.bold('\n📊 RESUMEN DEL ANÁLISIS'));
		console.log('='.repeat(60));

		console.log(chalk.cyan(`\n📦 DEPENDENCIAS TOTALES: ${this.analysis.total_dependencies}`));
		console.log(chalk.cyan(`🔍 DEPENDENCIAS CRÍTICAS: ${this.analysis.critical_dependencies.length}`));
		console.log(chalk.green(`✅ COMPATIBLES CON BUN: ${this.analysis.bun_compatible.length}`));
		console.log(chalk.yellow(`🔄 REQUIEREN MIGRACIÓN: ${this.analysis.requires_migration.length}`));
		console.log(chalk.red(`⚠️  PROBLEMAS POTENCIALES: ${this.analysis.potential_issues.length}`));

		console.log(chalk.cyan('\n🔌 PLUGINS DE VITE:'));
		for (const plugin of this.analysis.vite_plugins) {
			const complexity =
				plugin.migration_complexity === 'low' ? '🟢' : plugin.migration_complexity === 'medium' ? '🟡' : '🔴';
			console.log(`   ${complexity} ${plugin.name} - ${plugin.purpose}`);
		}

		console.log(chalk.yellow('\n🔄 MIGRACIONES CRÍTICAS:'));
		for (const item of this.analysis.requires_migration.filter((item) => item.priority === 'critical')) {
			console.log(`   🔴 ${item.name} - ${item.reason}`);
		}

		console.log(chalk.red('\n⚠️  PRINCIPALES DESAFÍOS:'));
		for (const issue of this.analysis.potential_issues.filter((issue) => issue.impact === 'high')) {
			console.log(`   🔴 ${issue.category}: ${issue.description}`);
		}

		console.log(chalk.blue('\n🎯 CHECKPOINT_3 COMPLETADO: Análisis de dependencias finalizado'));
		console.log(chalk.yellow('🔄 Siguiente: CHECKPOINT_4 - Preparación para migración completa'));
	}
}

// Ejecutar análisis
const analyzer = new DependencyAnalyzer();
analyzer.runAnalysis().catch(console.error);
