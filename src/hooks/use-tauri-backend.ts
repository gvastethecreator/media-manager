/**
 * Hook para gestionar la comunicación con el backend en entorno Tauri
 */

import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

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

			const result = await invoke<string>('check_backend_health');
			console.log('Backend health check:', result);

			setStatus({
				isRunning: true,
				isChecking: false,
				error: null,
			});
		} catch (error) {
			console.warn('Backend not available:', error);
			setStatus({
				isRunning: false,
				isChecking: false,
				error: String(error),
			});
		}
	};

	const getAppDataDir = async () => {
		try {
			const appDataDir = await invoke<string>('get_app_data_dir');
			return appDataDir;
		} catch (error) {
			console.error('Failed to get app data directory:', error);
			throw error;
		}
	};

	useEffect(() => {
		// Función interna para evitar dependencias
		const performHealthCheck = async () => {
			try {
				setStatus((prev) => ({ ...prev, isChecking: true, error: null }));

				const result = await invoke<string>('check_backend_health');
				console.log('Backend health check:', result);

				setStatus({
					isRunning: true,
					isChecking: false,
					error: null,
				});
			} catch (error) {
				console.warn('Backend not available:', error);
				setStatus({
					isRunning: false,
					isChecking: false,
					error: String(error),
				});
			}
		};

		// Verificar salud del backend al cargar
		performHealthCheck();

		// Verificar cada 30 segundos si el backend sigue funcionando
		const interval = setInterval(performHealthCheck, 30000);

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
				// @ts-ignore - window.__TAURI__ existe en contexto Tauri
				return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
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
	// En Tauri, siempre usar localhost
	if (typeof window !== 'undefined' && (window as any).__TAURI__) {
		return 'http://localhost:3001/api';
	}

	// En desarrollo web
	return process.env.VITE_API_URL || 'http://localhost:3001/api';
}
