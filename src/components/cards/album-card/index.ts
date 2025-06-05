export * from './album-card';
export * from './album-card-images';
export * from './album-server-actions';

// Componente memorizado para mejorar rendimiento
import { memo } from 'react';
import { AlbumCard } from './album-card';
export const MemoizedAlbumCard = memo(AlbumCard);
