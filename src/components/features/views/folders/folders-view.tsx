'use client';

import { ViewProps } from '../types';
import { CardGridView } from '../shared/card-grid-view';
import { useRouter } from 'next/navigation';

export function FoldersView({ isResizing }: ViewProps) {
  const router = useRouter();

  const fetchFolders = async (page: number) => {
    const response = await fetch(`/api/folders?page=${page}&pageSize=50`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  };

  const handleFolderClick = (folder: any) => {
    router.push(`/folders/${folder.id}`);
  };

  return (
    <CardGridView
      queryKey={['folders']}
      fetchFn={fetchFolders}
      onItemClick={handleFolderClick}
      isResizing={isResizing}
    />
  );
}
