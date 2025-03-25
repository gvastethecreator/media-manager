/**
 * @file Tipos para el store de Collection
 * @module store/entities/collection/types
 */

import type { CollectionExtended, CollectionViewConfig } from '@/types/entities/collection';

export interface CollectionState {
  collections: CollectionExtended[];
  viewConfig: CollectionViewConfig;
  selectedCollectionId: string | null;
  isLoading: boolean;
  error: string | null;
}