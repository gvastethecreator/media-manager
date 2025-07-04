#!/usr/bin/env bun
/**
 * Script de desarrollo del servidor con hot reload usando Bun nativo
 * Reemplaza tsup por el bundler integrado de Bun
 */

import { spawn } from 'child_process';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { existsSync } from 'fs';

const SERVER_SRC = 'src/server/index.ts';
const SERVER_DIST = 'dist/server/index.js';
const SERVER_DIR = 'src/server';

let serverProcess = null;

// Función para compilar el servidor con Bun
async function buildServer() {
    console.log(chalk.blue('🔨 Compilando servidor con Bun...'));

    try {
        const buildProcess = spawn('bun', [
            'build',
            SERVER_SRC,
            '--outdir', 'dist/server',
            '--target', 'node'
        ], {
            stdio: 'inherit',
            shell: true
        });

        return new Promise((resolve, reject) => {
            buildProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.green('✅ Build exitoso'));
                    resolve(true);
                } else {
                    console.log(chalk.red('❌ Error en build'));
                    reject(new Error(`Build falló con código ${code}`));
                }
            });
        });
    } catch (error) {
        console.error(chalk.red('❌ Error compilando servidor:'), error);
        throw error;
    }
}

// Función para iniciar el servidor
function startServer() {
    if (serverProcess) {
        console.log(chalk.yellow('🔄 Reiniciando servidor...'));
        serverProcess.kill();
    }

    if (!existsSync(SERVER_DIST)) {
        console.log(chalk.red('❌ Archivo compilado no encontrado:', SERVER_DIST));
        return;
    }

    console.log(chalk.green('🚀 Iniciando servidor...'));

    serverProcess = spawn('bun', [SERVER_DIST], {
        stdio: 'inherit',
        shell: true
    });

    serverProcess.on('error', (error) => {
        console.error(chalk.red('❌ Error ejecutando servidor:'), error);
    });

    serverProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.log(chalk.red(`❌ Servidor terminó con código ${code}`));
        }
    });
}

// Función principal
async function main() {
    console.log(chalk.cyan('🌟 Iniciando desarrollo del servidor con Bun hot reload'));

    try {
        // Build inicial
        await buildServer();
        startServer();

        // Configurar watcher
        console.log(chalk.blue('👀 Monitoreando cambios en', SERVER_DIR));

        const watcher = chokidar.watch(SERVER_DIR, {
            ignored: ['**/node_modules/**', '**/.git/**'],
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('change', async (path) => {
            console.log(chalk.yellow(`📝 Cambio detectado: ${path}`));

            try {
                await buildServer();
                startServer();
            } catch (error) {
                console.error(chalk.red('❌ Error en hot reload:'), error);
            }
        });

        // Manejar cierre graceful
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n🛑 Cerrando servidor...'));
            if (serverProcess) {
                serverProcess.kill();
            }
            watcher.close();
            process.exit(0);
        });

        console.log(chalk.green('✅ Hot reload activo. Presiona Ctrl+C para salir.'));

    } catch (error) {
        console.error(chalk.red('❌ Error iniciando desarrollo:'), error);
        process.exit(1);
    }
}

main();
