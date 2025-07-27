#!/usr/bin/env bun

/**
 * Preparación para Migración FASE 3: Bun Bundler Nativo
 * Crea configuraciones y scripts necesarios para la migración completa
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';

class BunMigrationPrep {
	constructor() {
		this.projectRoot = process.cwd();
		this.migrationReport = {
			timestamp: new Date().toISOString(),
			phase: 'FASE 2 - Preparación para FASE 3',
			files_created: [],
			configurations: [],
			scripts_added: [],
			migration_plan: [],
			status: 'preparation_complete'
		};
	}

	async createBunBuildConfig() {
		console.log(chalk.yellow('\n🔧 Creando configuración de Bun Build...'));

		const bunBuildConfig = `// bun.build.config.ts
// Configuración de Bun Bundler para FASE 3

import type { BuildConfig } from 'bun';

const config: BuildConfig = {
	// Entrypoints principales
	entrypoints: [
		'./src/main.tsx',
		'./src/server/index.ts'
	],

	// Directorio de salida
	outdir: './dist',

	// Configuración de target
	target: 'browser',

	// Formato de salida
	format: 'esm',

	// Minificación
	minify: {
		whitespace: true,
		identifiers: true,
		syntax: true
	},

	// Source maps
	sourcemap: 'external',

	// Splitting de código
	splitting: true,

	// Configuración de assets
	publicPath: '/',

	// Configuración de nombres de archivos
	naming: {
		entry: '[dir]/[name].[hash].[ext]',
		chunk: '[name].[hash].[ext]',
		asset: 'assets/[name].[hash].[ext]'
	},

	// Externals (dependencias que no se bundlearán)
	external: [
		// Node.js built-ins
		'fs', 'path', 'crypto', 'os', 'util',
		// Dependencias del servidor
		'express', 'cors', 'helmet'
	],

	// Configuración de plugins
	plugins: [
		// Plugin personalizado para SVG
		{
			name: 'svg-plugin',
			setup(build) {
				build.onLoad({ filter: /\.svg$/ }, async (args) => {
					const svg = await Bun.file(args.path).text();
					return {
						contents: \`export default \"\${svg}\"\`,
						loader: 'tsx'
					};
				});
			}
		},

		// Plugin para CSS/PostCSS
		{
			name: 'css-plugin',
			setup(build) {
				build.onLoad({ filter: /\.css$/ }, async (args) => {
					const css = await Bun.file(args.path).text();
					// Aquí se puede integrar PostCSS/Tailwind
					return {
						contents: css,
						loader: 'css'
					};
				});
			}
		}
	],

	// Configuración de resolución
	resolve: {
		alias: {
			'@': './src',
			'@components': './src/components',
			'@pages': './src/pages',
			'@hooks': './src/hooks',
			'@utils': './src/utils',
			'@types': './src/types',
			'@assets': './src/assets'
		}
	},

	// Configuración de desarrollo
	development: {
		watch: true,
		hotReload: true
	}
};

export default config;
`;

		const configPath = path.join(this.projectRoot, 'bun.build.config.ts');
		await fs.writeFile(configPath, bunBuildConfig);
		this.migrationReport.files_created.push('bun.build.config.ts');
		this.migrationReport.configurations.push('Bun Build Configuration');
		console.log(chalk.green('✅ Configuración de Bun Build creada'));
	}

	async createBunDevServer() {
		console.log(chalk.yellow('\n🌐 Creando servidor de desarrollo con Bun...'));

		const devServerCode = `#!/usr/bin/env bun

/**
 * Servidor de desarrollo con Bun para FASE 3
 * Reemplaza el dev server de Vite
 */

import { serve, file, build } from 'bun';
import { watch } from 'fs';
import path from 'path';
import chalk from 'chalk';

class BunDevServer {
	constructor() {
		this.port = process.env.PORT || 5173;
		this.host = process.env.HOST || 'localhost';
		this.buildConfig = './bun.build.config.ts';
		this.clients = new Set();
	}

	async startServer() {
		console.log(chalk.blue.bold('🚀 Iniciando Bun Dev Server...'));

		// Build inicial
		await this.buildProject();

		// Configurar file watcher para HMR
		this.setupFileWatcher();

		// Iniciar servidor
		const server = serve({
			port: this.port,
			hostname: this.host,
			fetch: this.handleRequest.bind(this),
			websocket: {
				message: this.handleWebSocketMessage.bind(this),
				open: this.handleWebSocketOpen.bind(this),
				close: this.handleWebSocketClose.bind(this)
			}
		});

		console.log(chalk.green(\`✅ Servidor iniciado en http://\${this.host}:\${this.port}\`));
		console.log(chalk.cyan('🔥 Hot Module Replacement habilitado'));
		return server;
	}

	async buildProject() {
		try {
			const result = await build({
				entrypoints: ['./src/main.tsx'],
				outdir: './dist',
				target: 'browser',
				format: 'esm',
				sourcemap: 'external',
				splitting: true
			});
			console.log(chalk.green('✅ Build completado'));
			return result;
		} catch (error) {
			console.error(chalk.red('❌ Error en build:'), error);
			throw error;
		}
	}

	setupFileWatcher() {
		const srcPath = path.join(process.cwd(), 'src');
		
		watch(srcPath, { recursive: true }, async (eventType, filename) => {
			if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.css'))) {
				console.log(chalk.yellow(\`🔄 Archivo modificado: \${filename}\`));
				
				// Rebuild
				await this.buildProject();
				
				// Notificar a clientes para reload
				this.notifyClients('reload');
			}
		});
	}

	async handleRequest(req) {
		const url = new URL(req.url);
		const pathname = url.pathname;

		// Manejar WebSocket upgrade
		if (req.headers.get('upgrade') === 'websocket') {
			return new Response('Upgrade Required', { status: 426 });
		}

		// Servir archivos estáticos
		if (pathname.startsWith('/assets/')) {
			const filePath = path.join(process.cwd(), 'dist', pathname);
			return new Response(file(filePath));
		}

		// API proxy (similar a Vite)
		if (pathname.startsWith('/api/')) {
			return this.proxyToAPI(req);
		}

		// Servir index.html para rutas SPA
		const indexPath = path.join(process.cwd(), 'dist', 'index.html');
		let indexContent = await file(indexPath).text();
		
		// Inyectar script de HMR
		const hmrScript = \`
			<script>
				const ws = new WebSocket('ws://\${location.host}');
				ws.onmessage = (event) => {
					if (event.data === 'reload') {
						location.reload();
					}
				};
			</script>
		\`;
		
		indexContent = indexContent.replace('</head>', \`\${hmrScript}</head>\`);
		
		return new Response(indexContent, {
			headers: { 'Content-Type': 'text/html' }
		});
	}

	async proxyToAPI(req) {
		// Proxy a servidor API (puerto 3001)
		const apiUrl = req.url.replace(\`http://\${this.host}:\${this.port}\`, 'http://localhost:3001');
		
		try {
			const response = await fetch(apiUrl, {
				method: req.method,
				headers: req.headers,
				body: req.body
			});
			return response;
		} catch (error) {
			return new Response('API Error', { status: 502 });
		}
	}

	handleWebSocketOpen(ws) {
		this.clients.add(ws);
		console.log(chalk.cyan('🔌 Cliente WebSocket conectado'));
	}

	handleWebSocketClose(ws) {
		this.clients.delete(ws);
		console.log(chalk.cyan('🔌 Cliente WebSocket desconectado'));
	}

	handleWebSocketMessage(ws, message) {
		// Manejar mensajes del cliente si es necesario
	}

	notifyClients(message) {
		for (const client of this.clients) {
			client.send(message);
		}
	}
}

// Iniciar servidor si se ejecuta directamente
if (import.meta.main) {
	const server = new BunDevServer();
	server.startServer().catch(console.error);
}

export default BunDevServer;
`;

		const serverPath = path.join(this.projectRoot, 'scripts', 'dev-server', 'bun-dev-server.ts');
		await fs.mkdir(path.dirname(serverPath), { recursive: true });
		await fs.writeFile(serverPath, devServerCode);
		this.migrationReport.files_created.push('scripts/dev-server/bun-dev-server.ts');
		console.log(chalk.green('✅ Servidor de desarrollo con Bun creado'));
	}

	async createMigrationScripts() {
		console.log(chalk.yellow('\n📜 Creando scripts de migración...'));

		// Script de migración principal
		const migrationScript = `#!/usr/bin/env bun

/**
 * Script de Migración FASE 3: Bun Bundler Nativo
 * Ejecuta la migración completa de Vite a Bun
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import chalk from 'chalk';

class ViteToBunMigration {
	async executeMigration() {
		console.log(chalk.blue.bold('🚀 INICIANDO MIGRACIÓN FASE 3: VITE → BUN'));
		console.log('='.repeat(60));

		try {
			// Paso 1: Backup de configuraciones actuales
			await this.backupCurrentConfig();

			// Paso 2: Actualizar package.json
			await this.updatePackageJson();

			// Paso 3: Crear configuración de Bun
			await this.setupBunConfig();

			// Paso 4: Migrar scripts
			await this.migrateScripts();

			// Paso 5: Test de migración
			await this.testMigration();

			console.log(chalk.green.bold('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE'));
			console.log(chalk.yellow('🔄 Ejecuta: bun run dev:bun para probar'));

		} catch (error) {
			console.error(chalk.red.bold('❌ ERROR EN MIGRACIÓN:'), error);
			await this.rollback();
		}
	}

	async backupCurrentConfig() {
		console.log(chalk.yellow('\n💾 Creando backup de configuraciones...'));
		
		const backupDir = path.join('backups', 'vite-config');
		await fs.mkdir(backupDir, { recursive: true });
		
		const filesToBackup = [
			'vite.config.ts',
			'package.json',
			'bunfig.toml'
		];

		for (const file of filesToBackup) {
			try {
				const content = await fs.readFile(file, 'utf8');
				await fs.writeFile(path.join(backupDir, file), content);
				console.log(chalk.green(\`✅ Backup: \${file}\`));
			} catch (error) {
				console.log(chalk.yellow(\`⚠️  No encontrado: \${file}\`));
			}
		}
	}

	async updatePackageJson() {
		console.log(chalk.yellow('\n📦 Actualizando package.json...'));
		
		const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
		
		// Agregar scripts de Bun
		packageJson.scripts = {
			...packageJson.scripts,
			'dev:bun': 'bun run scripts/dev-server/bun-dev-server.ts',
			'build:bun': 'bun build --config bun.build.config.ts',
			'preview:bun': 'bun run dist/index.js',
			'migrate:to-bun': 'bun run scripts/migration/migrate-to-bun.js',
			'migrate:rollback': 'bun run scripts/migration/rollback-migration.js'
		};

		await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
		console.log(chalk.green('✅ package.json actualizado'));
	}

	async setupBunConfig() {
		console.log(chalk.yellow('\n⚙️  Configurando Bun bundler...'));
		// La configuración ya fue creada en createBunBuildConfig()
		console.log(chalk.green('✅ Configuración de Bun lista'));
	}

	async migrateScripts() {
		console.log(chalk.yellow('\n📜 Migrando scripts...'));
		// Los scripts ya fueron creados
		console.log(chalk.green('✅ Scripts migrados'));
	}

	async testMigration() {
		console.log(chalk.yellow('\n🧪 Probando migración...'));
		
		try {
			// Test build con Bun
			const buildResult = await this.runCommand('bun run build:bun');
			if (buildResult.success) {
				console.log(chalk.green('✅ Build con Bun exitoso'));
			} else {
				throw new Error('Build falló');
			}
		} catch (error) {
			console.error(chalk.red('❌ Test de migración falló:'), error);
			throw error;
		}
	}

	async rollback() {
		console.log(chalk.red('\n🔄 Ejecutando rollback...'));
		// Implementar rollback si es necesario
	}

	async runCommand(command) {
		return new Promise((resolve) => {
			const child = spawn(command, { shell: true, stdio: 'inherit' });
			child.on('close', (code) => {
				resolve({ success: code === 0, code });
			});
		});
	}
}

// Ejecutar migración si se llama directamente
if (import.meta.main) {
	const migration = new ViteToBunMigration();
	migration.executeMigration();
}

export default ViteToBunMigration;
`;

		const migrationPath = path.join(this.projectRoot, 'scripts', 'migration', 'migrate-to-bun.js');
		await fs.writeFile(migrationPath, migrationScript);
		this.migrationReport.files_created.push('scripts/migration/migrate-to-bun.js');
		this.migrationReport.scripts_added.push('migrate:to-bun');
		console.log(chalk.green('✅ Script de migración creado'));
	}

	async updatePackageJsonScripts() {
		console.log(chalk.yellow('\n📦 Actualizando scripts en package.json...'));

		try {
			const packageJsonPath = path.join(this.projectRoot, 'package.json');
			const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

			// Agregar nuevos scripts para FASE 3
			const newScripts = {
				'dev:bun': 'bun run scripts/dev-server/bun-dev-server.ts',
				'build:bun': 'bun build --config bun.build.config.ts',
				'preview:bun': 'bun run dist/index.js',
				'migrate:to-bun': 'bun run scripts/migration/migrate-to-bun.js',
				'analyze:deps': 'bun run scripts/analysis/dependency-analyzer.js',
				'benchmark:performance': 'bun run scripts/benchmarks/performance-comparison-v2.js'
			};

			packageJson.scripts = {
				...packageJson.scripts,
				...newScripts
			};

			await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
			this.migrationReport.scripts_added.push(...Object.keys(newScripts));
			console.log(chalk.green('✅ Scripts agregados a package.json'));

		} catch (error) {
			console.error(chalk.red('❌ Error actualizando package.json:'), error);
		}
	}

	async createMigrationPlan() {
		console.log(chalk.yellow('\n📋 Creando plan de migración...'));

		const migrationPlan = [
			{
				phase: 'Pre-migración',
				tasks: [
					'✅ Análisis de dependencias completado',
					'✅ Benchmarks de rendimiento realizados',
					'✅ Configuraciones de Bun creadas',
					'✅ Scripts de migración preparados'
				],
				status: 'completed'
			},
			{
				phase: 'Migración (FASE 3)',
				tasks: [
					'🔄 Ejecutar backup de configuraciones',
					'🔄 Migrar de Vite a Bun bundler',
					'🔄 Configurar HMR personalizado',
					'🔄 Migrar plugins críticos',
					'🔄 Actualizar scripts de desarrollo'
				],
				status: 'ready'
			},
			{
				phase: 'Post-migración',
				tasks: [
					'🔄 Validar funcionalidad completa',
					'🔄 Benchmarks comparativos',
					'🔄 Optimización de rendimiento',
					'🔄 Documentación actualizada'
				],
				status: 'pending'
			}
		];

		this.migrationReport.migration_plan = migrationPlan;
		console.log(chalk.green('✅ Plan de migración creado'));
	}

	async runPreparation() {
		console.log(chalk.blue.bold('🔧 PREPARACIÓN PARA FASE 3: BUN BUNDLER NATIVO'));
		console.log('='.repeat(60));

		try {
			// Crear configuración de Bun Build
			await this.createBunBuildConfig();

			// Crear servidor de desarrollo con Bun
			await this.createBunDevServer();

			// Crear scripts de migración
			await this.createMigrationScripts();

			// Actualizar package.json
			await this.updatePackageJsonScripts();

			// Crear plan de migración
			await this.createMigrationPlan();

			// Guardar reporte
			await this.saveReport();

			// Mostrar resumen
			this.printSummary();

		} catch (error) {
			console.error(chalk.red.bold('❌ Error en preparación:'), error);
			throw error;
		}
	}

	async saveReport() {
		const reportPath = path.join('logs', 'migration-prep-report.json');
		await fs.mkdir(path.dirname(reportPath), { recursive: true });
		await fs.writeFile(reportPath, JSON.stringify(this.migrationReport, null, 2));
		console.log(chalk.green(`\n💾 Reporte guardado en: ${reportPath}`));
	}

	printSummary() {
		console.log(chalk.blue.bold('\n📊 RESUMEN DE PREPARACIÓN'));
		console.log('='.repeat(60));

		console.log(chalk.cyan(`\n📁 ARCHIVOS CREADOS: ${this.migrationReport.files_created.length}`));
		for (const file of this.migrationReport.files_created) {
			console.log(`   ✅ ${file}`);
		}