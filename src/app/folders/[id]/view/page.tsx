'use client';

import { FilesView } from '@/components/features/views/files/files-view';

interface FolderViewPageProps {
  params: {
    id: string
  }
}

export default function FolderViewPage({ params }: FolderViewPageProps) {
  return (
    <div className="h-full">
      <FilesView />
    </div>
  )
}