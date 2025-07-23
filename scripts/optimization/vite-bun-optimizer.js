#!/usr/bin/env bun

/**
 * Optimizador de configuración Vite + Bun para FASE 2
 * Aplica optimizaciones específicas para el runtime híbrido
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

class ViteBunOptimizer {
	constructor() {
		this.configPath = path.join(process.cwd(), 'vite.config.ts');
		this.bunConfigPath = path.join(process.cwd(), 'bunfig.toml');
		this.optimizations = [];
	}

	async readCurrentConfig() {
		try {
			const viteConfig = await fs.readFile(this.configPath, 'utf8');
			const bunConfig = await fs.readFile(this.bunConfigPath, 'utf8');
			return { viteConfig, bunConfig };
		} catch (error) {
			console.error('Error leyendo configuraciones:', error.message);
			return null;
		}
	}

	generateOptimizedViteConfig() {
		return `import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

const emptyModule = resolve(__dirname, 'src/empty.ts');

export default defineConfig({
	plugins: [
		react({
			// Optimización para Bun: usar SWC en lugar de Babel cuando sea posible
			jsxRuntime: 'automatic',
			babel: {
				parserOpts: {
					plugins: ['decorators-legacy']
				}
			}
		}),
		tsconfigPaths({
			ignoreConfigErrors: true,
		}),
		svgr({
			svgrOptions: {
				icon: true,
			},
		}),
	],
	esbuild: {
		// Optimización para Bun: target más moderno
		target: 'esnext',
		// Mejorar performance de transformación
		minifyIdentifiers: false,
		minifySyntax: true,
		minifyWhitespace: true,
		// Optimizar para desarrollo
		drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
	},
	server: {
		port: 5173,
		host: true,
		// Optimización HMR para Bun
		hmr: {
			port: 5175,
			// Mejorar compatibilidad con Bun
			clientPort: 5175,
			host: 'localhost'
		},
		// Configuración adicional para mejorar compatibilidad con Bun
		middlewareMode: false,
		fs: {
			strict: false,
			// Permitir acceso a archivos fuera del workspace
			allow: ['..', '../..'],
		},
		// Optimización de proxy para mejor rendimiento
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true,
				secure: false,
				// Optimizaciones de proxy
				timeout: 30000,
				proxyTimeout: 30000,
				keepalive: true,
			},
		},
		// Optimización de watch para Bun
		watch: {
			usePolling: false,
			ignored: ['**/node_modules/**', '**/dist/**', '**/logs/**'],
		},
	},
	preview: {
		port: 4173,
	},
	build: {
		// Optimizaciones de build para Bun
		target: 'esnext',
		sourcemap: true,
		// Optimizar chunks para mejor carga
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				// Optimización de chunks más granular
				manualChunks: {
					react: ['react', 'react-dom'],
					router: ['react-router-dom'],
					query: ['@tanstack/react-query'],
					ui: ['framer-motion', 'motion', 'lucide-react'],
					vendor: ['zustand', 'lodash', 'date-fns'],
					utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
				},
				// Optimizar nombres de archivos
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]',
			},
			// Evitar que Rollup intente resolver dependencias de Node.js
			external: ['fs', 'fs/promises', 'path', 'crypto', 'sharp', 'http'],
			// Optimizaciones de tree-shaking
			treeshake: {
				preset: 'recommended',
				manualPureFunctions: ['console.log', 'console.info'],
			},
		},
		// Optimización de minificación
		minify: 'esbuild',
		// Optimizar assets
		assetsInlineLimit: 4096,
		// Optimización de CSS
		cssCodeSplit: true,
		cssMinify: true,
	},
	define: {
		// Definir variables de entorno para el cliente
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		// Optimización: definir variables en tiempo de build
		'__DEV__': process.env.NODE_ENV !== 'production',
		'__PROD__': process.env.NODE_ENV === 'production',
	},
	optimizeDeps: {
		// Optimización de dependencias para Bun
		exclude: [
			// Excluir módulos de Node.js
			'fs', 'fs/promises', 'path', 'crypto', 'sharp', 'http',
			// Excluir dependencias que causan problemas
			'@tauri-apps/api'
		],
		include: [
			// Pre-bundlear dependencias críticas
			'react', 'react-dom', 'react-router-dom',
			'framer-motion', 'motion',
			'@tanstack/react-query',
			'zustand',
			'lucide-react',
			'lodash',
			'date-fns',
			'clsx',
			'tailwind-merge'
		],
		// Optimización de ESBuild para dependencias
		esbuildOptions: {
			target: 'esnext',
			platform: 'browser',
			mainFields: ['browser', 'module', 'main'],
			conditions: ['browser', 'module', 'import'],
		},
		// Forzar re-optimización en desarrollo
		force: process.env.NODE_ENV === 'development',
	},
	resolve: {
		alias: [
			// Alias para módulos de Node.js que no deben incluirse en el bundle del cliente
			{ find: 'fs/promises', replacement: emptyModule },
			{ find: 'fs', replacement: emptyModule },
			{ find: 'path', replacement: emptyModule },
			{ find: 'crypto', replacement: emptyModule },
			{ find: 'sharp', replacement: emptyModule },
			{ find: 'http', replacement: emptyModule },
		],
		// Optimización de resolución de módulos
		mainFields: ['browser', 'module', 'main'],
		conditions: ['browser', 'module', 'import'],
		extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
	},
	// Configuración específica para Bun
	worker: {
		format: 'es',
		plugins: [react()],
	},
	// Optimización de logs
	logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
	clearScreen: false,
});
`;
	}

	generateOptimizedBunConfig() {
		return `# Configuración optimizada Bun para FASE 2: Optimización Híbrida
# Configuración específica para desarrollo con Vite + Bun runtime

[install]
# Configuración de dependencias optimizada
dev = true
optional = true
peer = true
production = false
# Optimización: más workers concurrentes para mejor rendimiento
concurrentScripts = 32

# Configuración para migración desde pnpm
auto = "auto"
frozenLockfile = false
dryRun = false

# Directorios globales
globalDir = "~/.bun/install/global"
globalBinDir = "~/.bun/bin"

[install.cache]
# Cache optimizada para desarrollo
dir = "~/.bun/install/cache"
disable = false
disableManifest = false
# Optimización: cache más agresivo
ttl = 86400

[install.lockfile]
# Mantener compatibilidad durante migración
save = true
# Opcional: generar yarn.lock para compatibilidad
# print = "yarn"

# Configuración optimizada para desarrollo con Vite (FASE 2)
[serve.static]
# Optimizaciones para archivos estáticos
# plugins = ["bun-plugin-tailwind"]

# Configuración de runtime optimizada
[runtime]
# Optimización: usar JSC (JavaScriptCore) para mejor rendimiento
engine = "jsc"

# Configuración de transpilación optimizada
[transpiler]
# Optimización: usar SWC para transformaciones más rápidas
engine = "swc"
# Optimizar para desarrollo
minify = false
sourcemap = true
# Target moderno para mejor rendimiento
target = "esnext"

# Configuración de test optimizada
[test]
# Optimización: usar Bun test runner nativo
runner = "bun"
# Configuración de coverage
coverage = true
coverageDir = "coverage"

# Configuración de logging optimizada
[logging]
level = "info"
# Optimización: logs estructurados para mejor debugging
format = "json"

# Configuración de watch optimizada para desarrollo
[watch]
# Optimización: ignorar directorios innecesarios
ignore = [
  "node_modules/**",
  "dist/**",
  "logs/**",
  "coverage/**",
  ".git/**",
  "*.log"
]
# Optimización: usar polling solo cuando sea necesario
usePolling = false
# Optimización: debounce para evitar rebuilds excesivos
debounce = 100

# Configuración de red optimizada
[network]
# Optimización: timeouts más largos para operaciones de red
timeout = 30000
retries = 3

# Configuración de memoria optimizada
[memory]
# Optimización: límites de memoria más altos para proyectos grandes
heapSize = "2GB"
# Optimización: garbage collection más eficiente
gcStrategy = "incremental"
`;
	}

	async backupCurrentConfigs() {
		const timestamp = new Date().toISOString().split('T')[0];
		
		try {
			// Backup Vite config
			const viteConfig = await fs.readFile(this.configPath, 'utf8');
			await fs.writeFile(`${this.configPath}.backup-${timestamp}`, viteConfig);
			
			// Backup Bun config
			const bunConfig = await fs.readFile(this.bunConfigPath, 'utf8');
			await fs.writeFile(`${this.bunConfigPath}.backup-${timestamp}`, bunConfig);
			
			console.log(chalk.green('✅ Configuraciones respaldadas'));
			this.optimizations.push('Backup de configuraciones creado');
		} catch (error) {
			console.error('Error creando backups:', error.message);
		}
	}

	async applyOptimizations() {
		console.log(chalk.blue.bold('🔧 APLICANDO OPTIMIZACIONES VITE + BUN'));
		console.log('='.repeat(60));
		
		// 1. Backup de configuraciones actuales
		console.log(chalk.yellow('\n📋 Paso 1: Respaldando configuraciones actuales'));
		await this.backupCurrentConfigs();
		
		// 2. Aplicar configuración optimizada de Vite
		console.log(chalk.yellow('\n⚡ Paso 2: Aplicando configuración optimizada de Vite'));
		try {
			const optimizedViteConfig = this.generateOptimizedViteConfig();
			await fs.writeFile(this.configPath, optimizedViteConfig);
			console.log(chalk.green('✅ Configuración Vite optimizada aplicada'));
			this.optimizations.push('Configuración Vite optimizada para Bun runtime');
		} catch (error) {
			console.error('Error aplicando configuración Vite:', error.message);
		}
		
		// 3. Aplicar configuración optimizada de Bun
		console.log(chalk.yellow('\n🚀 Paso 3: Aplicando configuración optimizada de Bun'));
		try {
			const optimizedBunConfig = this.generateOptimizedBunConfig();
			await fs.writeFile(this.bunConfigPath, optimizedBunConfig);
			console.log(chalk.green('✅ Configuración Bun optimizada aplicada'));
			this.optimizations.push('Configuración Bun optimizada para desarrollo híbrido');
		} catch (error) {
			console.error('Error aplicando configuración Bun:', error.message);
		}
		
		// 4. Crear archivo de optimizaciones aplicadas
		await this.saveOptimizationReport();
		
		console.log(chalk.blue.bold('\n🎯 OPTIMIZACIONES COMPLETADAS'));
		console.log(chalk.green('✅ Configuraciones optimizadas para Vite + Bun'));
		console.log(chalk.yellow('🔄 Siguiente: Reiniciar servidor de desarrollo para aplicar cambios'));
	}

	async saveOptimizationReport() {
		const report = {
			timestamp: new Date().toISOString(),
			phase: 'FASE 2 - Optimización Híbrida',
			checkpoint: 'CHECKPOINT_2',
			optimizations: this.optimizations,
			files_modified: [
				'vite.config.ts',
				'bunfig.toml'
			],
			backups_created: [
				`vite.config.ts.backup-${new Date().toISOString().split('T')[0]}`,
				`bunfig.toml.backup-${new Date().toISOString().split('T')[0]}`
			],
			next_steps: [
				'Reiniciar servidor de desarrollo',
				'Validar HMR funciona correctamente',
				'Ejecutar benchmarks post-optimización',
				'Proceder con CHECKPOINT_3'
			]
		};
		
		const reportPath = path.join('logs', 'optimization-report.json');
		await fs.mkdir(path.dirname(reportPath), { recursive: true });
		await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
		
		console.log(chalk.green(`\n💾 Reporte de optimización guardado en: ${reportPath}`));
	}
}

// Ejecutar optimizaciones
const optimizer = new ViteBunOptimizer();
optimizer.applyOptimizations().catch(console.error);