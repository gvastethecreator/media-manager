export type { PromptCardProps } from './prompt-card';
export { PromptCard } from './prompt-card';
export * from './prompt-card-content';
export * from './prompt-card-footer';
export * from './prompt-card-images';
export * from './prompt-server-actions';

// Componente memorizado para mejorar rendimiento
import { memo } from 'react';
import { PromptCard } from './prompt-card';
export const MemoizedPromptCard = memo(PromptCard);
