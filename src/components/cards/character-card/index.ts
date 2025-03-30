export * from './character-card';
export * from './character-card-content';
export * from './character-card-footer';
export * from './character-card-header';
export * from './character-card-images';
export * from './character-server-actions';

// Componente memorizado para mejorar rendimiento
import { memo } from 'react';
import { CharacterCard } from './character-card';
export const MemoizedCharacterCard = memo(CharacterCard);

