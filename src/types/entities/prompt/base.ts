/**
 * @file Tipos base para la entidad Prompt
 * @module types/entities/prompt/base
 * @description Define los tipos base de Prompt siguiendo el patrón EntityWithStats
 */

import type { BaseEntity } from '@/types/common/base';

/**
 * 🎯 Tipo base para Prompt derivado del schema de Prisma
 */
export interface PromptBase extends BaseEntity {
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	purpose: string;
	category: string;
	parameters: string; // JSON serializado de PromptParameter[]
	tags: string; // JSON serializado de string[]
	featuredImage: string | null;
	isFavorite: boolean;
}

/**
 * 📊 Estadísticas específicas de Prompt con métricas de IA
 */
export interface PromptStatistics {
	// Conteos de relaciones
	totalImages: number;
	totalVideos: number;
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalConcepts: number;
	totalNotes: number;
	totalWildcards: number;
	totalProperties: number;
	totalGroups: number;

	// Métricas de contenido
	totalContentItems: number;
	averageContentLength: number;
	parametersCount: number;
	tagsCount: number;

	// Métricas de IA y uso
	executionCount: number;
	successRate: number;
	averageExecutionTime: number;
	confidenceScore: number;
	popularityScore: number;

	// Análisis temporal
	lastExecutedAt: Date | null;
	createdThisMonth: boolean;
	updatedThisWeek: boolean;
	executedToday: boolean;

	// Análisis de calidad
	hasDescription: boolean;
	hasFeaturedImage: boolean;
	isWellStructured: boolean; // Tiene parámetros y tags
	qualityScore: number; // 0-100
}

/**
 * 🔢 Conteos de Prisma para Prompt
 */
export interface PromptCounts {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tagEntities: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * 🎯 Tipo principal optimizado de Prompt con estadísticas pre-calculadas
 * Sigue el patrón EntityWithStats para máximo rendimiento
 */
export interface PromptWithStats extends PromptBase, PromptCounts {
	// Campos JSON deserializados
	parameters: Array<{
		name: string;
		type: 'string' | 'number' | 'boolean' | 'array' | 'object';
		description?: string;
		required?: boolean;
		defaultValue?: unknown;
		options?: string[];
	}>;
	tags: string[];

	// Estadísticas pre-calculadas
	statistics: PromptStatistics;

	// Metadatos de IA
	aiMetadata?: {
		model?: string;
		temperature?: number;
		maxTokens?: number;
		topP?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		lastModelUsed?: string;
		averageResponseTime?: number;
	};

	// Análisis de rendimiento
	performance?: {
		averageTokensGenerated: number;
		averageExecutionTime: number;
		successfulExecutions: number;
		failedExecutions: number;
		lastErrorMessage?: string;
		lastExecutionTimestamp?: Date;
	};
}

/**
 * 🔍 Consulta optimizada de Prisma para PromptWithStats
 */
export const PrismaPromptWithCounts = {
	include: {
		_count: {
			select: {
				images: true,
				videos: true,
				albums: true,
				collections: true,
				tagEntities: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
			},
		},
	},
} as const;

/**
 * 📋 Tipo derivado de la consulta de Prisma
 */
export type PrismaPromptWithCounts = {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	purpose: string;
	category: string;
	parameters: string;
	tags: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tagEntities: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
};