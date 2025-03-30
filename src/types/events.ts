/**
 * @file Tipos para el sistema de eventos
 * @module types/events
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Severidad del evento
 */
export enum EventSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

/**
 * Categoría del evento
 */
export enum EventCategory {
    SYSTEM = 'system',
    SECURITY = 'security',
    USER = 'user',
    FILE = 'file',
    TASK = 'task',
    INTEGRATION = 'integration'
}

/**
 * Estado del evento
 */
export enum EventStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

/**
 * Evento base
 */
export interface BaseEvent {
    id: EntityId;
    type: string;
    category: EventCategory;
    severity: EventSeverity;
    status: EventStatus;
    timestamp: Date;
    source: string;
    message: string;
    data?: JSONString<Record<string, unknown>>;
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Manejador de eventos
 */
export interface EventHandler<T extends BaseEvent = BaseEvent> {
    id: EntityId;
    type: string;
    priority: number;
    filter?: {
        categories?: EventCategory[];
        severities?: EventSeverity[];
        types?: string[];
    };
    handle: (event: T) => Promise<void>;
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Cola de eventos
 */
export interface EventQueue {
    id: EntityId;
    name: string;
    type: string;
    maxSize: number;
    retentionPeriod: number;
    handlers: EventHandler[];
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Suscripción a eventos
 */
export interface EventSubscription {
    id: EntityId;
    queueId: EntityId;
    filter: {
        categories?: EventCategory[];
        severities?: EventSeverity[];
        types?: string[];
    };
    callback: string;
    metadata?: JSONString<Record<string, unknown>>;
}

// Validaciones Zod
export const eventSeveritySchema = z.nativeEnum(EventSeverity);
export const eventCategorySchema = z.nativeEnum(EventCategory);
export const eventStatusSchema = z.nativeEnum(EventStatus);

export const baseEventSchema = z.object({
    id: z.string(),
    type: z.string(),
    category: eventCategorySchema,
    severity: eventSeveritySchema,
    status: eventStatusSchema,
    timestamp: z.date(),
    source: z.string(),
    message: z.string(),
    data: z.string().optional(),
    metadata: z.string().optional()
});

export const eventHandlerSchema = z.object({
    id: z.string(),
    type: z.string(),
    priority: z.number(),
    filter: z.object({
        categories: z.array(eventCategorySchema).optional(),
        severities: z.array(eventSeveritySchema).optional(),
        types: z.array(z.string()).optional()
    }).optional(),
    handle: z.function().args(z.any()).returns(z.promise(z.void())),
    metadata: z.string().optional()
});

export const eventQueueSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    maxSize: z.number(),
    retentionPeriod: z.number(),
    handlers: z.array(eventHandlerSchema),
    metadata: z.string().optional()
});

export const eventSubscriptionSchema = z.object({
    id: z.string(),
    queueId: z.string(),
    filter: z.object({
        categories: z.array(eventCategorySchema).optional(),
        severities: z.array(eventSeveritySchema).optional(),
        types: z.array(z.string()).optional()
    }),
    callback: z.string(),
    metadata: z.string().optional()
});

// Tipos inferidos
export type BaseEventValidated = z.infer<typeof baseEventSchema>;
export type EventHandlerValidated = z.infer<typeof eventHandlerSchema>;
export type EventQueueValidated = z.infer<typeof eventQueueSchema>;
export type EventSubscriptionValidated = z.infer<typeof eventSubscriptionSchema>;