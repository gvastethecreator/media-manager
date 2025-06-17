/**
 * Exportación de componentes de TagCard
 * @module components/cards/tag-card
 */

export type { TagCardProps } from './tag-card';
export * from './tag-card';

// Componente memorizado para mejorar rendimiento
import { memo } from 'react';
import { TagCard } from './tag-card';
export const MemoizedTagCard = memo(TagCard);
