#!/usr/bin/env bun

/**
 * Script de prueba para verificar que el servidor se puede compilar
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue('🧪 Probando build del servidor...'));

const buildProcess = spawn('bun', ['build', 'src/server/index.ts', '--outdir', 'dist/server', '--target', 'node'], {
  stdio: 'inherit',
  shell: true,
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log(chalk.green('✅ Build exitoso - El problema está solucionado!'));
  } else {
    console.log(chalk.red('❌ Build falló con código ' + code));
  }
});
