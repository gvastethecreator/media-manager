'use client';

import { useNavigationStore } from '@/store/navigation';
import { DashboardView } from './dashboard/dashboard-view';
import { AllImagesView } from './all-images/all-images-view';
import { FilesView } from './files/files-view';
import { CollectionsView } from './collections/collections-view';
import { TagsView } from './tags/tags-view';
import { FavoritesView } from './favorites/favorites-view';

interface ViewContainerProps {
  isResizing?: boolean;
}

export function ViewContainer({ isResizing }: ViewContainerProps) {
  const { currentView } = useNavigationStore();

  switch (currentView) {
    case 'files':
      return <FilesView />;
    case 'collections':
      return <CollectionsView />;
    case 'tags':
      return <TagsView />;
    case 'all-images':
      return <AllImagesView />;
    case 'favorites':
      return <FavoritesView />;
    case 'dashboard':
    default:
      return <DashboardView />;
  }
}
