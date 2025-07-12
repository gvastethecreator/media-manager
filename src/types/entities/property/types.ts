/**
 * @file Tipos para Property
 * @module types/entities/property/types
 * @description Este archivo contiene tipos auxiliares para la entidad Property.
 */

import type { PropertyBase, PropertyStatistics, PropertyWithStats } from './base';

// Alias para compatibilidad
export type PropertyComplete = PropertyWithStats;
export type PropertyPreview = Omit<PropertyBase, 'createdAt' | 'updatedAt'>;
