import { memo } from 'react';
import { ConceptCard } from './concept-card';

export const MemoizedConceptCard = memo(ConceptCard);
export { ConceptCard } from './concept-card';
export * from './concept-card-content';
export * from './concept-card-footer';
export * from './concept-card-images';
// export * from './concept-server-actions'; // TODO: Archivo no encontrado
