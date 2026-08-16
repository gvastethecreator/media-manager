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
		// El broker local mantiene la sesión fuera del bundle de React.
		apiBaseUrl: '/api',
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
		// Solo intentar importar si realmente estamos en Tauri
		if (typeof window !== 'undefined' && '__TAURI__' in window) {
			// Usar Function constructor para evitar análisis estático de TypeScript
			const importTauriOS = new Function('return import("@tauri-apps/api/os")');
			const os = await importTauriOS();
			const osType = await os.type();
			return {
				type: osType,
				isWindows: osType === 'Windows_NT',
				isMacOS: osType === 'Darwin',
				isLinux: osType === 'Linux',
			};
		}
		return null;
	} catch (error) {
		// Silenciar el error si no estamos en Tauri
		console.warn('Tauri OS API no disponible:', error);
		return null;
	}
};

// Funciones de comunicación con el backend de Tauri
export const tauriInvoke = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
	if (!isTauri()) {
		throw new Error('tauriInvoke is only available in the desktop environment');
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
