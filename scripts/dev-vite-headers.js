#!/usr/bin/env node

/**
 * Script para iniciar Vite con configuración para manejar headers grandes
 * Esto resuelve el error 431 "Request Header Fields Too Large"
 */

const { spawn } = require('child_process');
const path = require('path');

// Configurar variables de entorno para manejar headers grandes
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-http-header-size=32768`;

console.log('🚀 Iniciando Vite con soporte para headers grandes...');
console.log('🔧 NODE_OPTIONS:', process.env.NODE_OPTIONS);

// Ejecutar Vite
const viteProcess = spawn('bunx', ['vite'], {
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
	console.log(`🔚 Vite terminó con código: ${code}`);
	process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
	console.log('\n👋 Deteniendo Vite...');
	viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
	console.log('\n👋 Deteniendo Vite...');
	viteProcess.kill('SIGTERM');
});
