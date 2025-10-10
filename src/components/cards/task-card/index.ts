/**
 * @file Exportador para TaskCard
 * @module components/cards/task-card
 */

export * from './task-card';
export * from './task-card.types';
export * from './task-card-content';
export * from './task-card-footer';
export * from './task-card-header';

// Componente memorizado para mejorar rendimiento
import { TaskCard } from './task-card';
export const MemoizedTaskCard = TaskCard;
