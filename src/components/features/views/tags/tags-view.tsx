'use client';

import { ViewProps } from '../types';
import { CardGridView } from '../shared/card-grid-view';
import { useRouter } from 'next/navigation';

export function TagsView({ isResizing }: ViewProps) {
  const router = useRouter();

  const fetchTags = async (page: number) => {
    const response = await fetch(`/api/tags?page=${page}&pageSize=50`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  };

  const handleTagClick = (tag: any) => {
    router.push(`/tags/${tag.id}`);
  };

  return (
    <CardGridView
      queryKey={['tags']}
      fetchFn={fetchTags}
      onItemClick={handleTagClick}
      isResizing={isResizing}
    />
  );
}
