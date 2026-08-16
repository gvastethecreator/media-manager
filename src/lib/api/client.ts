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

export class ApiClientError extends Error {
	readonly code?: string;
	readonly payload: unknown;
	readonly status: number;

	constructor(status: number, message: string, payload: unknown, code?: string) {
		super(`HTTP ${status}: ${message}`);
		this.name = 'ApiClientError';
		this.code = code;
		this.payload = payload;
		this.status = status;
	}
}

export class ApiTransportError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ApiTransportError';
	}
}

export type ApiRequestMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export interface ApiRetryOptions {
	/**
	 * Required for replaying a mutation. PUT/PATCH/DELETE stay single-shot even
	 * with this key because their server contracts do not yet persist it.
	 */
	idempotencyKey?: string;
	retryAttempts?: number;
}

const SAFE_RETRY_METHODS = new Set<ApiRequestMethod>(['GET']);

export function shouldRetryApiRequest(
	method: ApiRequestMethod,
	options: ApiRetryOptions | undefined,
	failureCount: number,
	error: unknown,
	maxRetries: number
): boolean {
	if (failureCount >= maxRetries) return false;
	if (SAFE_RETRY_METHODS.has(method)) return shouldRetryApiError(failureCount, error, maxRetries);
	// POST may opt in only when the caller carries an explicit server-recognized
	// key. Other mutations remain single-shot until their APIs persist one.
	if (method === 'POST' && options?.idempotencyKey?.trim()) {
		return shouldRetryApiError(failureCount, error, maxRetries);
	}
	return false;
}

export function shouldRetryApiError(failureCount: number, error: unknown, maxRetries: number): boolean {
	if (failureCount >= maxRetries) return false;
	if (error instanceof ApiTransportError) return true;
	if (!(error instanceof ApiClientError)) return false;
	const payload =
		error.payload && typeof error.payload === 'object' ? (error.payload as Record<string, unknown>) : null;
	if (payload?.retryable === false) return false;
	if (payload?.retryable === true) return true;
	return error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500;
}

export class ApiClient {
	private readonly baseURL: string;
	private readonly defaultTimeout: number;

	constructor(options?: { timeout?: number }) {
		// Usar el proxy de Vite en desarrollo y la misma URL base en producción
		const browserOrigin =
			typeof window !== 'undefined' && typeof window.location?.origin === 'string' ? window.location.origin : '';
		this.baseURL = process.env.NODE_ENV === 'development' ? '' : browserOrigin;
		this.defaultTimeout = options?.timeout ?? 30_000; // 30s default timeout
	}

	/**
	 * Realiza una petición GET
	 */
	get<T>(endpoint: string, options?: { params?: Record<string, unknown> } & ApiRetryOptions): Promise<T> {
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
		return this.request<T>('GET', url, undefined, options);
	}

	/**
	 * Realiza una petición POST
	 */
	post<T>(endpoint: string, data?: unknown, options?: ApiRetryOptions): Promise<T> {
		return this.request<T>('POST', endpoint, data, options);
	}

	/**
	 * Realiza una petición PUT
	 */
	put<T>(endpoint: string, data?: unknown, options?: ApiRetryOptions): Promise<T> {
		return this.request<T>('PUT', endpoint, data, options);
	}

	/**
	 * Realiza una petición PATCH
	 */
	patch<T>(endpoint: string, data?: unknown, options?: ApiRetryOptions): Promise<T> {
		return this.request<T>('PATCH', endpoint, data, options);
	}

	/**
	 * Realiza una petición DELETE
	 */
	delete<T>(endpoint: string, data?: unknown, options?: ApiRetryOptions): Promise<T> {
		return this.request<T>('DELETE', endpoint, data, options);
	}

	/**
	 * Método privado para realizar peticiones HTTP
	 */
	private async request<T>(
		method: ApiRequestMethod,
		endpoint: string,
		data?: unknown,
		options?: ApiRetryOptions
	): Promise<T> {
		const maxRetries = options?.retryAttempts ?? 0;
		for (let failureCount = 0; ; failureCount += 1) {
			try {
				return await this.requestOnce<T>(method, endpoint, data, options);
			} catch (error) {
				if (!shouldRetryApiRequest(method, options, failureCount, error, maxRetries)) throw error;
			}
		}
	}

	private async requestOnce<T>(
		method: ApiRequestMethod,
		endpoint: string,
		data?: unknown,
		options?: ApiRetryOptions
	): Promise<T> {
		// Agregar prefijo /api si no está presente
		const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
		const url = `${this.baseURL}${apiEndpoint}`;

		apiLogger.info(`🌐 ${method} ${endpoint}`, { hasBody: data !== undefined });

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

			const config: RequestInit = {
				method,
				headers: {
					'Content-Type': 'application/json',
					// Fuerza a no usar caché del navegador para evitar UIs desactualizadas tras reindex
					'Cache-Control': 'no-cache',
				},
				// Evita caching del lado del cliente en todos los métodos (especialmente GET)
				cache: 'no-store',
				signal: controller.signal,
			};
			if (options?.idempotencyKey?.trim()) {
				(config.headers as Record<string, string>)['Idempotency-Key'] = options.idempotencyKey;
			}

			if (data !== undefined && method !== 'GET') {
				config.body = JSON.stringify(data);
			}

			let response: Response;
			try {
				response = await fetch(url, config);
			} finally {
				clearTimeout(timeoutId);
			}

			if (!response.ok) {
				let errorText: string;
				try {
					errorText = await response.text();
				} catch {
					errorText = response.statusText;
				}
				let payload: unknown = errorText;
				try {
					payload = JSON.parse(errorText);
				} catch {
					// Plain-text error responses remain supported.
				}
				const structured = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : undefined;
				const message = typeof structured?.message === 'string' ? structured.message : errorText;
				const code = typeof structured?.code === 'string' ? structured.code : undefined;
				const logHttpFailure =
					response.status >= 500 ? apiLogger.error.bind(apiLogger) : apiLogger.warn.bind(apiLogger);
				logHttpFailure(`HTTP ${response.status} for ${method} ${endpoint}`, {
					code,
					status: response.status,
				});
				throw new ApiClientError(response.status, message, payload, code);
			}

			if (response.status === 204) return undefined as T;

			let result: T;
			try {
				result = await response.json();
			} catch {
				throw new Error(`Invalid JSON response from ${method} ${endpoint}`);
			}
			apiLogger.info(`✅ ${method} ${endpoint} exitoso`);

			return result;
		} catch (error) {
			if (error instanceof ApiClientError) throw error;
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			apiLogger.error(`💥 Fallo en ${method} ${endpoint}`, {
				error: errorMessage,
			});
			throw new ApiTransportError(`Error en API call: ${errorMessage}`, {
				cause: error instanceof Error ? error : undefined,
			});
		}
	}
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Export default para compatibilidad
export default apiClient;
