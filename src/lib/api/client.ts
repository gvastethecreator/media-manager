/// <reference lib="dom" />
/**
 * @file Cliente API centralizado para comunicación con el servidor Express
 * @module lib/api/client
 * ✅ Reemplaza server actions de Next.js con API calls estándar
 */

import { clientLogger } from '@/lib/logger/client-logger';

const apiLogger = clientLogger.withContext('ApiClient');

export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	success: boolean;
	message?: string;
}

export class ApiClient {
	private baseURL: string;

	constructor() {
		// Usar el proxy de Vite en desarrollo y la misma URL base en producción
		this.baseURL = process.env.NODE_ENV === 'development' ? '' : window.location.origin;
	}

	/**
	 * Realiza una petición GET
	 */
	async get<T>(endpoint: string): Promise<T> {
		return this.request<T>('GET', endpoint);
	}

	/**
	 * Realiza una petición POST
	 */
	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>('POST', endpoint, data);
	}

	/**
	 * Realiza una petición PUT
	 */
	async put<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>('PUT', endpoint, data);
	}

	/**
	 * Realiza una petición PATCH
	 */
	async patch<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>('PATCH', endpoint, data);
	}

	/**
	 * Realiza una petición DELETE
	 */
	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>('DELETE', endpoint);
	}

	/**
	 * Método privado para realizar peticiones HTTP
	 */
	private async request<T>(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		endpoint: string,
		data?: unknown
	): Promise<T> {
		// Agregar prefijo /api si no está presente
		const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
		const url = `${this.baseURL}${apiEndpoint}`;

		apiLogger.info(`🌐 ${method} ${endpoint}`, { data });

		try {
			const config: RequestInit = {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
			};

			if (data && method !== 'GET') {
				config.body = JSON.stringify(data);
			}

			const response = await fetch(url, config);

			if (!response.ok) {
				const errorText = await response.text();
				const errorMessage = `HTTP ${response.status}: ${errorText}`;
				apiLogger.error(`❌ Error en ${method} ${endpoint}`, {
					status: response.status,
					error: errorText,
				});
				throw new Error(errorMessage);
			}

			const result = await response.json();
			apiLogger.info(`✅ ${method} ${endpoint} exitoso`);

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			apiLogger.error(`💥 Fallo en ${method} ${endpoint}`, { error: errorMessage });
			throw new Error(`Error en API call: ${errorMessage}`);
		}
	}
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Export default para compatibilidad
export default apiClient;
