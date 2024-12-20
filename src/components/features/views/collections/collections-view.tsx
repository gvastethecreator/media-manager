'use client';

import { ViewProps } from '../types';
import { CardGridView } from '../shared/card-grid-view';
import { useRouter } from 'next/navigation';

export function CollectionsView({ isResizing }: ViewProps) {
  const router = useRouter();

  const fetchCollections = async (page: number) => {
    const response = await fetch(`/api/collections?page=${page}&pageSize=50`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  };

  const handleCollectionClick = (collection: any) => {
    router.push(`/collections/${collection.id}`);
  };

  return (
    <CardGridView
      queryKey={['collections']}
      fetchFn={fetchCollections}
      onItemClick={handleCollectionClick}
      isResizing={isResizing}
    />
  );
}
