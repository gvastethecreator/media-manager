/**
 * Hook para gestionar la comunicación con el backend en entorno Tauri
 */

import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';

// --- Constantes ---
const HEALTH_CHECK_INTERVAL = 900_000; // 15 minutos (900s)
const DEFAULT_API_URL = 'http://localhost:4000/api';
const TAURI_COMMANDS = {
	CHECK_HEALTH: 'check_backend_health',
	GET_APP_DATA_DIR: 'get_app_data_dir',
} as const;

interface BackendStatus {
	isRunning: boolean;
	isChecking: boolean;
	error: string | null;
}

export function useTauriBackend() {
	const [status, setStatus] = useState<BackendStatus>({
		isRunning: false,
		isChecking: true,
		error: null,
	});

	const checkBackendHealth = async () => {
		try {
			setStatus((prev) => ({ ...prev, isChecking: true, error: null }));

			const result = await invoke<string>(TAURI_COMMANDS.CHECK_HEALTH);
			clientLogger.debug('Backend health check:', result);

			setStatus({
				isRunning: true,
				isChecking: false,
				error: null,
			});
		} catch (error) {
			clientLogger.warn('Backend not available:', error);
			setStatus({
				isRunning: false,
				isChecking: false,
				error: String(error),
			});
		}
	};

	const getAppDataDir = async () => {
		try {
			const appDataDir = await invoke<string>(TAURI_COMMANDS.GET_APP_DATA_DIR);
			return appDataDir;
		} catch (error) {
			clientLogger.error('Failed to get app data directory:', error);
			throw error;
		}
	};

	useEffect(() => {
		// Función interna para evitar dependencias
		const performHealthCheck = async () => {
			try {
				setStatus((prev) => ({ ...prev, isChecking: true, error: null }));

				const result = await invoke<string>(TAURI_COMMANDS.CHECK_HEALTH);
				clientLogger.debug('Backend health check:', result);

				setStatus({
					isRunning: true,
					isChecking: false,
					error: null,
				});
			} catch (error) {
				clientLogger.warn('Backend not available:', error);
				setStatus({
					isRunning: false,
					isChecking: false,
					error: String(error),
				});
			}
		};

		// Verificar salud del backend al cargar
		performHealthCheck();

		// Verificar salud periódicamente para reducir ruido
		const interval = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);

		return () => clearInterval(interval);
	}, []);

	return {
		...status,
		checkBackendHealth,
		getAppDataDir,
	};
}

/**
 * Hook para detectar si estamos ejecutando en Tauri
 */
export function useTauriContext() {
	const [isTauri, setIsTauri] = useState(false);

	useEffect(() => {
		// Verificar si estamos en Tauri
		const checkTauri = () => {
			try {
				const w = window as unknown as { __TAURI__?: unknown };
				return typeof window !== 'undefined' && typeof w.__TAURI__ !== 'undefined';
			} catch {
				return false;
			}
		};

		setIsTauri(checkTauri());
	}, []);

	return isTauri;
}

/**
 * Utilidad para obtener la URL base de la API según el contexto
 */
export function getApiBaseUrl(): string {
	// En desarrollo, usar localhost directo
	if (process.env.NODE_ENV === 'development') {
		return DEFAULT_API_URL;
	}

	// En producción, usar la variable de entorno o fallback
	return process.env.VITE_API_URL || DEFAULT_API_URL;
}
