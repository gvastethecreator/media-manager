'use client';

import { FolderContentView } from '@/components/views/folders/folder-content-view';

interface FolderViewPageProps {
  params: {
    id: string
  }
}

export default function FolderViewPage({ params }: FolderViewPageProps) {
  return (
    <div className="h-full">
      <FolderContentView />
    </div>
  )
}