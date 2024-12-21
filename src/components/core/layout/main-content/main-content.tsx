'use client';

import { useNavigationStore } from '@/store/navigation'
import { FilesView } from '@/components/features/views/files/files-view'
import { CollectionsView } from '@/components/features/views/collections/collections-view'
import { TagsView } from '@/components/features/views/tags/tags-view'
import { DashboardView } from '@/components/features/views/dashboard/dashboard-view'
import { AllImagesView } from '@/components/features/views/all-images/all-images-view'
import { FavoritesView } from '@/components/features/views/favorites/favorites-view'
import { cn } from '@/lib/utils'
import type { MainContentProps } from '@/types/ui'

export function MainContent({ children, className }: MainContentProps) {
  const { currentView } = useNavigationStore()

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      {children}
    </div>
  )
}
