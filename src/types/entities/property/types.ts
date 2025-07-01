/**
 * @file Tipos para Property
 * @module types/entities/property/types
 * @deprecated Este archivo está siendo migrado hacia el patrón `...WithStats`
 * @see /src/types/entities/property/base.ts para los tipos canónicos
 */

import type { PropertyBase, PropertyStatistics } from './base';

// Re-exportar los tipos canónicos desde base.ts
export type {
	PrismaPropertyWithCounts,
	PropertyBase,
	PropertyStatistics,
	PropertyWithStats
} from './base';

// Tipos legacy - usar PropertyWithStats en su lugar
export interface PropertyComplete extends PropertyBase {
	// Relaciones completas cuando sea necesario
	stats?: PropertyStatistics;
}

export interface PropertyPreview extends Pick<PropertyBase, 'id' | 'name' | 'emoji' | 'color'> {
	stats?: {
		usageCount?: number;
	};
}
