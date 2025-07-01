/*
 * @file src/lib/api/client.ts
 * @description Cliente HTTP ligero basado en fetch para consumir la API Express.
 *              Diseñado para usarse con React Query.
 */

import { serverLogger } from '@/lib/logger/server-logger';

const apiLogger = serverLogger.withContext('APIClient');

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
	body?: unknown;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
	const url = `${API_BASE}${path}`;

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	const fetchOptions: RequestInit = {
		...options,
		method,
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	};

	apiLogger.debug(`${method} ${url}`);

	const res = await fetch(url, fetchOptions);

	if (!res.ok) {
		const message = await res.text();
		apiLogger.error(`❌ ${method} ${url} → ${res.status}`, message);
		throw new Error(message || 'Error inesperado en la petición');
	}

	// Algunos endpoints responden vacío (204) o binario; intentar JSON y fallback texto
	if (res.status === 204) return undefined as unknown as T;

	const contentType = res.headers.get('content-type');
	if (contentType?.includes('application/json')) {
		return (await res.json()) as T;
	}
	const blob = await res.blob();
	return blob as unknown as T;
}

export const api = {
	get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
	post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
	put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
	patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
	delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};

export default api;
