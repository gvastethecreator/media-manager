/**
 * Configuración de base de datos específica para Tauri
 * Maneja la ubicación de la BD según el contexto (desarrollo/producción)
 */

import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';

/**
 * Obtiene la ruta de la base de datos según el contexto de ejecución
 */
export async function getDatabasePath(): Promise<string> {
	try {
		// Verificar si estamos en Tauri
		if (typeof window !== 'undefined' && (window as any).__TAURI__) {
			// En Tauri, usar el directorio de datos de la aplicación
			const appDataDir = await invoke<string>('get_app_data_dir');
			return join(appDataDir, 'db.sqlite');
		}
	} catch (error) {
		console.warn('No se pudo obtener el directorio de datos de Tauri:', error);
	}

	// Fallback para desarrollo web
	return './db.sqlite';
}

/**
 * Configuración de variables de entorno para Tauri
 */
export async function setupTauriEnvironment(): Promise<void> {
	try {
		if (typeof window !== 'undefined' && (window as any).__TAURI__) {
			const dbPath = await getDatabasePath();

			// Configurar variables específicas para Tauri
			process.env.TAURI_ENV = 'desktop';
			process.env.DATABASE_URL = `file:${dbPath}`;

			console.log('Tauri environment configured:', {
				databasePath: dbPath,
				mode: 'desktop',
			});
		}
	} catch (error) {
		console.error('Error configurando entorno Tauri:', error);
	}
}

/**
 * Verifica si las dependencias del backend están disponibles
 */
export async function checkBackendDependencies(): Promise<{
	hasDatabase: boolean;
	hasNodeRuntime: boolean;
	errors: string[];
}> {
	const errors: string[] = [];
	let hasDatabase = false;
	let hasNodeRuntime = false;

	try {
		// Verificar acceso a la base de datos
		const dbPath = await getDatabasePath();
		// Aquí podrías agregar lógica para verificar si el archivo existe
		hasDatabase = true;
	} catch (error) {
		errors.push(`Error accediendo a la base de datos: ${error}`);
	}

	try {
		// Verificar que el backend responda
		const response = await fetch('http://localhost:4000/health');
		hasNodeRuntime = response.ok;
	} catch (error) {
		errors.push(`Backend no disponible: ${error}`);
	}

	return {
		hasDatabase,
		hasNodeRuntime,
		errors,
	};
}
