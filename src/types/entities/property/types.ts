/**
 * @file Tipos para Property
 * @module types/entities/property/types
 * @description Este archivo contiene tipos auxiliares para la entidad Property.
 */

import type { PropertyBase, PropertyStatistics, PropertyWithStats } from './base';

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
