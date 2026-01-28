/**
 * @file Barrel export for Effect utilities
 * @module lib/effect
 * @description Punto de entrada para todas las utilidades de Effect
 */

// Re-exports comunes de Effect
export { Context, Effect, Layer, pipe } from 'effect';
// Runtime
export * from './runtime/runtime';
// Services
export * from './services/drizzle.service';
