'use client';

import { useFilesStore } from '@/store/files'
import { FoldersView } from '@/components/features/views/folders/folders-view'
import { FolderView } from '@/components/features/views/folder/folder-view'
import { CollectionsView } from '@/components/features/views/collections/collections-view'
import { TagsView } from '@/components/features/views/tags/tags-view'
import { DashboardView } from '@/components/features/views/dashboard/dashboard-view'

export function MainContent() {
  const { currentView } = useFilesStore()
  console.log('Vista actual:', currentView)

  switch (currentView) {
    case 'folders':
      return <FoldersView />
    case 'folder':
      return <FolderView />
    case 'collections':
      return <CollectionsView />
    case 'tags':
      return <TagsView />
    default:
      return <DashboardView />
  }
}
