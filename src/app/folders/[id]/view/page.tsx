'use client';

import { FolderView } from '@/components/features/views/folder/folder-view';
import { useParams } from 'next/navigation';

interface FolderViewPageProps {
  params: {
    id: string
  }
}

export default function FolderViewPage({ params }: FolderViewPageProps) {
  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
      <FolderView />
    </div>
  )
}