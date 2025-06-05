/**
 * @file Tipos para el sistema de integración con servicios externos
 * @module types/integrations
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Tipo de servicio externo
 */
export enum ExternalServiceType {
	STORAGE = 'storage',
	AI = 'ai',
	EMAIL = 'email',
	NOTIFICATION = 'notification',
	ANALYTICS = 'analytics',
	AUTHENTICATION = 'authentication',
	CDN = 'cdn',
}

/**
 * Estado de conexión
 */
export enum ConnectionStatus {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	ERROR = 'error',
}

/**
 * Proveedor de servicio
 */
export enum ServiceProvider {
	// Almacenamiento
	AWS_S3 = 'aws-s3',
	GOOGLE_CLOUD = 'google-cloud',
	AZURE_STORAGE = 'azure-storage',
	DROPBOX = 'dropbox',

	// IA
	OPENAI = 'openai',
	AZURE_AI = 'azure-ai',
	GOOGLE_AI = 'google-ai',

	// Email
	SENDGRID = 'sendgrid',
	MAILGUN = 'mailgun',
	SES = 'ses',

	// Notificaciones
	FIREBASE = 'firebase',
	ONESIGNAL = 'onesignal',
	PUSHER = 'pusher',

	// Analíticas
	GOOGLE_ANALYTICS = 'google-analytics',
	MIXPANEL = 'mixpanel',
	SEGMENT = 'segment',

	// Autenticación
	AUTH0 = 'auth0',
	OKTA = 'okta',
	COGNITO = 'cognito',

	// CDN
	CLOUDFLARE = 'cloudflare',
	FASTLY = 'fastly',
	AKAMAI = 'akamai',
}

/**
 * Configuración de integración
 */
export interface IntegrationConfig {
	id: EntityId;
	type: ExternalServiceType;
	provider: ServiceProvider;
	name: string;
	description?: string;
	enabled: boolean;
	credentials: JSONString<Record<string, unknown>>;
	settings: JSONString<Record<string, unknown>>;
	retryPolicy?: {
		maxAttempts: number;
		backoffDelay: number;
		timeout: number;
	};
}

/**
 * Estado de integración
 */
export interface IntegrationState {
	id: EntityId;
	status: ConnectionStatus;
	lastConnected?: Date;
	lastError?: string;
	metrics: {
		requestCount: number;
		errorCount: number;
		latency: number;
	};
}

/**
 * Operación de integración
 */
export interface IntegrationOperation {
	id: EntityId;
	integrationId: EntityId;
	type: string;
	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	payload: JSONString<Record<string, unknown>>;
	result?: JSONString<Record<string, unknown>>;
	error?: string;
	startedAt: Date;
	completedAt?: Date;
}

/**
 * Resultado de operación
 */
export interface IntegrationResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	metadata?: JSONString<Record<string, unknown>>;
	timestamp: Date;
}

// Validaciones Zod
export const externalServiceTypeSchema = z.nativeEnum(ExternalServiceType);
export const connectionStatusSchema = z.nativeEnum(ConnectionStatus);
export const serviceProviderSchema = z.nativeEnum(ServiceProvider);

export const integrationConfigSchema = z.object({
	id: z.string(),
	type: externalServiceTypeSchema,
	provider: serviceProviderSchema,
	name: z.string(),
	description: z.string().optional(),
	enabled: z.boolean(),
	credentials: z.string(),
	settings: z.string(),
	retryPolicy: z
		.object({
			maxAttempts: z.number().positive(),
			backoffDelay: z.number().nonnegative(),
			timeout: z.number().positive(),
		})
		.optional(),
});

export const integrationStateSchema = z.object({
	id: z.string(),
	status: connectionStatusSchema,
	lastConnected: z.date().optional(),
	lastError: z.string().optional(),
	metrics: z.object({
		requestCount: z.number().nonnegative(),
		errorCount: z.number().nonnegative(),
		latency: z.number().nonnegative(),
	}),
});

export const integrationOperationSchema = z.object({
	id: z.string(),
	integrationId: z.string(),
	type: z.string(),
	status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
	payload: z.string(),
	result: z.string().optional(),
	error: z.string().optional(),
	startedAt: z.date(),
	completedAt: z.date().optional(),
});

export const integrationResultSchema = z.object({
	success: z.boolean(),
	data: z.unknown().optional(),
	error: z.string().optional(),
	metadata: z.string().optional(),
	timestamp: z.date(),
});

// Tipos inferidos
export type IntegrationConfigValidated = z.infer<typeof integrationConfigSchema>;
export type IntegrationStateValidated = z.infer<typeof integrationStateSchema>;
export type IntegrationOperationValidated = z.infer<typeof integrationOperationSchema>;
export type IntegrationResultValidated = z.infer<typeof integrationResultSchema>;
