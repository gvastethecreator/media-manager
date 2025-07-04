#!/usr/bin/env bun
/**
 * Script para ejecutar frontend (Vite) y backend (Express) simultáneamente
 * Ejecuta ambos servidores en paralelo con logs diferenciados
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

const processes = [];

// Función para manejar la salida con colores
function logWithPrefix(prefix, color, data) {
  const lines = data.toString().split('\n').filter(line => line.trim());
  for (const line of lines) {
    console.log(chalk[color](`[${prefix}]`), line);
  }
}

// Función para limpiar procesos al salir
function cleanup() {
  console.log(chalk.yellow('\n🛑 Cerrando servidores...'));
  for (const proc of processes) {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  }
  process.exit(0);
}

// Manejar señales de cierre
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

console.log(chalk.blue('🚀 Iniciando desarrollo completo...'));
console.log(chalk.gray('   Frontend: http://localhost:5173'));
console.log(chalk.gray('   Backend:  http://localhost:3001\n'));

// Ejecutar frontend (Vite)
const viteProcess = spawn('bun', ['run', 'dev:vite'], {
  stdio: 'pipe',
  shell: true,
  cwd: process.cwd()
});

viteProcess.stdout.on('data', (data) => {
  logWithPrefix('VITE', 'cyan', data);
});

viteProcess.stderr.on('data', (data) => {
  logWithPrefix('VITE', 'red', data);
});

viteProcess.on('error', (error) => {
  console.error(chalk.red(`[VITE] Error: ${error.message}`));
});

processes.push(viteProcess);

// Ejecutar backend (Express con hot reload)
const serverProcess = spawn('bun', ['run', 'dev:server:hot'], {
  stdio: 'pipe',
  shell: true,
  cwd: process.cwd()
});

serverProcess.stdout.on('data', (data) => {
  logWithPrefix('SERVER', 'green', data);
});

serverProcess.stderr.on('data', (data) => {
  logWithPrefix('SERVER', 'red', data);
});

serverProcess.on('error', (error) => {
  console.error(chalk.red(`[SERVER] Error: ${error.message}`));
});

processes.push(serverProcess);

console.log(chalk.yellow('⌨️  Presiona Ctrl+C para detener ambos servidores\n'));
