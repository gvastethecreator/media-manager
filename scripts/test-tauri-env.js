#!/usr/bin/env node

/**
 * Script para probar la configuración de variables de entorno del backend
 */

// Configurar variables de entorno como lo haría Tauri
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'file:./db.sqlite';
process.env.API_PORT = '3001';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.VITE_API_URL = 'http://localhost:3001/api';
process.env.TAURI_ENV = 'dev';

console.log('🧪 Probando configuración de backend para Tauri...\n');

console.log('📋 Variables de entorno configuradas:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL:', process.env.DATABASE_URL);
console.log('- API_PORT:', process.env.API_PORT);
console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('- TAURI_ENV:', process.env.TAURI_ENV);
console.log();

// Probar importación del módulo de configuración
try {
	console.log('🔧 Probando módulo de configuración...');
	const { ENV } = await import('../src/config/env.ts');
	console.log('✅ Módulo ENV cargado correctamente');
	console.log('📊 Configuración ENV:', ENV);
	console.log();
} catch (error) {
	console.error('❌ Error cargando configuración ENV:', error.message);
	process.exit(1);
}

// Probar conexión a base de datos
try {
	console.log('🗃️ Probando conexión a base de datos...');
	const { db } = await import('../src/lib/database/db.ts');
	console.log('✅ Conexión a base de datos establecida');
	console.log();
} catch (error) {
	console.error('❌ Error conectando a base de datos:', error.message);
	console.error('Stack:', error.stack);
	process.exit(1);
}

console.log('🎉 Todas las configuraciones funcionan correctamente');
console.log('✅ El backend debería poder arrancar sin problemas en Tauri');
