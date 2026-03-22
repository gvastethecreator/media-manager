#!/usr/bin/env node

/**
 * Script para iniciar Vite con configuración para manejar headers grandes
 * Esto resuelve el error 431 "Request Header Fields Too Large"
 */

const { spawn } = require('child_process');

// Configurar variables de entorno para manejar headers grandes
// Aumentamos a 128KB para asegurar que cookies grandes no bloqueen la carga
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-http-header-size=131072`;

console.log('🚀 Iniciando Vite+ con soporte para headers grandes (128KB)...');
console.log('🔧 NODE_OPTIONS:', process.env.NODE_OPTIONS);

// Ejecutar Vite+ (vp dev)
const viteProcess = spawn('bun', ['run', 'dev:vite:app'], {
	stdio: 'inherit',
	shell: true,
	cwd: process.cwd(),
	env: process.env,
});

viteProcess.on('error', (error) => {
	console.error('❌ Error al iniciar Vite:', error);
	process.exit(1);
});

viteProcess.on('close', (code) => {
	console.log(`🔚 Vite+ terminó con código: ${code}`);
	process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
	console.log('\n👋 Deteniendo Vite+...');
	viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
	console.log('\n👋 Deteniendo Vite+...');
	viteProcess.kill('SIGTERM');
});
