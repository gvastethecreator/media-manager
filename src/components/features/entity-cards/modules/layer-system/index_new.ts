'use client';

/**
 * ⚠️ MÓDULO LEGADO - SE MANTIENE POR COMPATIBILIDAD
 *
 * Este módulo se mantiene para garantizar la compatibilidad con el código existente.
 * Las implementaciones actuales están en `@/components/features/entity-cards/layers/`.
 *
 * Por favor, actualiza tus importaciones para usar la nueva ubicación cuando sea posible.
 */

// Re-exportar todo desde los archivos adaptadores
export * from './layer-plugin-system';
export * from './register-layers';

// Re-exportar desde implementaciones modernas
export * from './layers';
