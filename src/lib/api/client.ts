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
	message?: string;
	success: boolean;
}

export class ApiClient {
	private readonly baseURL: string;

	constructor() {
		// Usar el proxy de Vite en desarrollo y la misma URL base en producción
		this.baseURL = process.env.NODE_ENV === 'development' ? '' : window.location.origin;
	}

	/**
	 * Realiza una petición GET
	 */
	get<T>(endpoint: string, options?: { params?: Record<string, unknown> }): Promise<T> {
		// Construir URL con query params si se proporcionan
		let url = endpoint;
		if (options?.params) {
			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(options.params)) {
				if (value !== undefined && value !== null) {
					searchParams.append(key, String(value));
				}
			}
			const queryString = searchParams.toString();
			if (queryString) {
				url = `${endpoint}?${queryString}`;
			}
		}
		return this.request<T>('GET', url);
	}

	/**
	 * Realiza una petición POST
	 */
	post<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>('POST', endpoint, data);
	}

	/**
	 * Realiza una petición PUT
	 */
	put<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>('PUT', endpoint, data);
	}

	/**
	 * Realiza una petición PATCH
	 */
	patch<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>('PATCH', endpoint, data);
	}

	/**
	 * Realiza una petición DELETE
	 */
	delete<T>(endpoint: string): Promise<T> {
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
					// Fuerza a no usar caché del navegador para evitar UIs desactualizadas tras reindex
					'Cache-Control': 'no-cache',
					Pragma: 'no-cache',
				},
				// Evita caching del lado del cliente en todos los métodos (especialmente GET)
				cache: 'no-store',
			};

			if (data && method !== 'GET') {
				config.body = JSON.stringify(data);
			}

			const response = await fetch(url, config);

			if (!response.ok) {
				let errorText: string;
				try {
					errorText = await response.text();
				} catch {
					errorText = response.statusText;
				}
				const errorMessage = `HTTP ${response.status}: ${errorText}`;
				apiLogger.error(`❌ Error en ${method} ${endpoint}`, {
					status: response.status,
					error: errorText,
				});
				throw new Error(errorMessage);
			}

			let result: T;
			try {
				result = await response.json();
			} catch {
				throw new Error(`Invalid JSON response from ${method} ${endpoint}`);
			}
			apiLogger.info(`✅ ${method} ${endpoint} exitoso`);

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			apiLogger.error(`💥 Fallo en ${method} ${endpoint}`, {
				error: errorMessage,
			});
			throw new Error(`Error en API call: ${errorMessage}`);
		}
	}
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Export default para compatibilidad
export default apiClient;
