/**
 * =================================================================================
 * TASKS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla tasks para gestión de tareas y proyectos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Tabla principal de Tasks
 * Gestión de tareas con estados, prioridades y seguimiento
 */
export const tasks = sqliteTable('Task', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	status: text('status', {
		enum: ['pending', 'in_progress', 'completed', 'cancelled'],
	})
		.notNull()
		.default('pending'),
	priority: text('priority', {
		enum: ['low', 'medium', 'high', 'urgent'],
	})
		.notNull()
		.default('medium'),

	// Metadata visual
	emoji: text('emoji').default('📋'),
	color: text('color').default('#6366f1'),
	category: text('category'),
	tags: text('tags'), // JSON array de tags

	// Fechas y tiempos
	dueDate: integer('dueDate', { mode: 'timestamp_ms' }),
	completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
	estimatedHours: real('estimatedHours'),
	actualHours: real('actualHours'),

	// Progreso
	progress: integer('progress').notNull().default(0), // 0-100

	// Asignación y relaciones
	assignedTo: text('assignedTo'), // ID de usuario o nombre
	parentTaskId: text('parentTaskId'), // Para subtareas
	projectId: text('projectId'), // Futuro: relación con proyectos

	// Notas adicionales
	notes: text('notes'),
	featuredImage: text('featuredImage'), // Imagen destacada opcional

	// Favoritos y visibilidad
	isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
	isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),

	// Timestamps
	createdAt: integer('createdAt', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
});

/**
 * Tipo inferido desde la tabla Drizzle
 */
export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
