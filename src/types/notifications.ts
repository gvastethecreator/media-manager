/**
 * @file Tipos para el sistema de notificaciones
 * @module types/notifications
 */

import { z } from 'zod';
import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { EventSeverity } from './events';

/**
 * Tipo de notificación
 */
export enum NotificationType {
	SYSTEM = 'system',
	USER = 'user',
	TASK = 'task',
	UPDATE = 'update',
	ALERT = 'alert',
}

/**
 * Estado de notificación
 */
export enum NotificationStatus {
	UNREAD = 'unread',
	READ = 'read',
	ARCHIVED = 'archived',
	DELETED = 'deleted',
}

/**
 * Canal de notificación
 */
export enum NotificationChannel {
	IN_APP = 'in_app',
	EMAIL = 'email',
	PUSH = 'push',
	WEBHOOK = 'webhook',
}

/**
 * Notificación base
 */
export interface BaseNotification {
	id: EntityId;
	type: NotificationType;
	severity: EventSeverity;
	status: NotificationStatus;
	channel: NotificationChannel;
	title: string;
	message: string;
	timestamp: Date;
	recipient: EntityId;
	data?: JSONString<Record<string, unknown>>;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Preferencias de notificación
 */
export interface NotificationPreferences {
	userId: EntityId;
	channels: {
		[key in NotificationChannel]: boolean;
	};
	types: {
		[key in NotificationType]: boolean;
	};
	severityThreshold: EventSeverity;
	schedule?: {
		enabled: boolean;
		startTime?: string;
		endTime?: string;
		timezone?: string;
	};
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Template de notificación
 */
export interface NotificationTemplate {
	id: EntityId;
	name: string;
	type: NotificationType;
	channel: NotificationChannel;
	titleTemplate: string;
	messageTemplate: string;
	variables: string[];
	metadata?: JSONString<Record<string, unknown>>;
}

// Validaciones Zod
export const notificationTypeSchema = z.nativeEnum(NotificationType);
export const notificationStatusSchema = z.nativeEnum(NotificationStatus);
export const notificationChannelSchema = z.nativeEnum(NotificationChannel);

export const baseNotificationSchema = z.object({
	id: z.string(),
	type: notificationTypeSchema,
	severity: z.nativeEnum(EventSeverity),
	status: notificationStatusSchema,
	channel: notificationChannelSchema,
	title: z.string(),
	message: z.string(),
	timestamp: z.date(),
	recipient: z.string(),
	data: z.string().optional(),
	metadata: z.string().optional(),
});

export const notificationPreferencesSchema = z.object({
	userId: z.string(),
	channels: z.record(z.boolean()),
	types: z.record(z.boolean()),
	severityThreshold: z.nativeEnum(EventSeverity),
	schedule: z
		.object({
			enabled: z.boolean(),
			startTime: z.string().optional(),
			endTime: z.string().optional(),
			timezone: z.string().optional(),
		})
		.optional(),
	metadata: z.string().optional(),
});

export const notificationTemplateSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: notificationTypeSchema,
	channel: notificationChannelSchema,
	titleTemplate: z.string(),
	messageTemplate: z.string(),
	variables: z.array(z.string()),
	metadata: z.string().optional(),
});

// Tipos inferidos
export type BaseNotificationValidated = z.infer<typeof baseNotificationSchema>;
export type NotificationPreferencesValidated = z.infer<typeof notificationPreferencesSchema>;
export type NotificationTemplateValidated = z.infer<typeof notificationTemplateSchema>;
