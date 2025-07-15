export * from './world-item-card';
export * from './world-item-card-content';
export * from './world-item-card-footer';
export * from './world-item-card-images';

// export * from './world-item-server-actions'; // TODO: Archivo no encontrado

// Componente memorizado para mejorar rendimiento
import { memo } from 'react';
import { WorldItemCard } from './world-item-card';
export const MemoizedWorldItemCard = memo(WorldItemCard);
