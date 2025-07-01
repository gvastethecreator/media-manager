/**
 * @file Tipos para Audio
 * @module types/entities/audio/types
 * @deprecated Este archivo está siendo migrado hacia el patrón `...WithStats`
 * @see /src/types/entities/audio/base.ts para los tipos canónicos
 */

// Re-exportar los tipos canónicos desde base.ts
export type {
	AudioBase,
	AudioStatistics,
	AudioWithStats,
} from './base';

// Tipos legacy - usar AudioWithStats en su lugar
export interface AudioComplete extends AudioBase {
	stats?: AudioStatistics;
}

export interface AudioPreview extends Pick<AudioBase, 'id' | 'name' | 'format' | 'duration'> {
	stats?: {
		size: number;
		duration?: number;
	};
}

// Import types for legacy compatibility
import type { AudioBase, AudioStatistics } from './base';
