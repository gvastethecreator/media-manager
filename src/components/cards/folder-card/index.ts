export * from './folder-card';
export * from './folder-card-content';
export * from './folder-card-footer';
export * from './folder-card-header';
export * from './folder-card-images';
export * from './folder-server-actions';

// Componente memorizado para mejorar rendimiento
import { memo } from 'react';
import { FolderCard } from './folder-card';
export const MemoizedFolderCard = memo(FolderCard);

