import { memo } from 'react';
import { ImageCard } from './image-card';

export const MemoizedImageCard = memo(ImageCard);
export { ImageCard } from './image-card';
// export * from './image-server-actions'; // TODO: Archivo no encontrado
