/**
 * Configuración y utilidades específicas para Tauri
 * Maneja la detección de entorno y configuración de APIs
 */

// Detectar si estamos ejecutando en Tauri
export const isTauri = (): boolean => {
	return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Configuración de la aplicación según el entorno
export const getAppConfig = () => {
	const isDesktop = isTauri();

	return {
		isDesktop,
		isBrowser: !isDesktop,
		// URL base para APIs - en desktop usamos el servidor embebido
		apiBaseUrl: isDesktop ? 'http://localhost:3001/api' : '/api',
		// Configuración de CORS
		corsEnabled: !isDesktop,
		// Configuración de rutas
		useHashRouter: isDesktop, // Para evitar problemas con rutas en desktop
	};
};

// Utilidades para interactuar con el sistema operativo
export const getOSInfo = async () => {
	if (!isTauri()) {
		return null;
	}

	try {
		// Para Tauri v2, las APIs se importan dinámicamente
		const { type } = await import('@tauri-apps/api/os');
		const osType = await type();
		return {
			type: osType,
			isWindows: osType === 'Windows_NT',
			isMacOS: osType === 'Darwin',
			isLinux: osType === 'Linux',
		};
	} catch (error) {
		console.error('Error obteniendo información del OS:', error);
		return null;
	}
};

// Funciones de comunicación con el backend de Tauri
export const tauriInvoke = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
	if (!isTauri()) {
		throw new Error('tauriInvoke solo está disponible en el entorno desktop');
	}

	try {
		const { invoke } = await import('@tauri-apps/api/core');
		return await invoke<T>(command, args);
	} catch (error) {
		console.error(`Error invocando comando Tauri '${command}':`, error);
		throw error;
	}
};

// Configurar el comportamiento específico de Tauri
export const initializeTauriApp = async () => {
	if (!isTauri()) {
		console.log('Ejecutando en modo navegador');
		return;
	}

	console.log('Ejecutando en modo desktop con Tauri');

	// Obtener información del sistema
	const osInfo = await getOSInfo();
	console.log('Sistema operativo:', osInfo);

	// Configuraciones específicas para desktop
	// Aquí se pueden agregar más inicializaciones específicas de Tauri
};

// Hook personalizado para configuración reactiva
export const useTauriConfig = () => {
	const config = getAppConfig();

	return {
		...config,
		osInfo: getOSInfo(),
		invoke: tauriInvoke,
	};
};
