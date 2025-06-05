export * from './place-card';
export * from './place-card-content';
export * from './place-card-footer';
export * from './place-card-header';
export * from './place-card-images';
export * from './place-server-actions';

// Componente memorizado para mejorar rendimiento
import { memo } from 'react';
import { PlaceCard } from './place-card';
export const MemoizedPlaceCard = memo(PlaceCard);
