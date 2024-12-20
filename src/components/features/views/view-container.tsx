'use client';

import { ViewType, ViewProps } from './types';
import { DashboardView } from './dashboard/dashboard-view';
import { AllImagesView } from './all-images/all-images-view';
import { CollectionsView } from './collections/collections-view';
import { FoldersView } from './folders/folders-view';
import { TagsView } from './tags/tags-view';
import { SearchView } from './search/search-view';
import { FileView } from '../file-management/file-browser/file-browser';

interface ViewContainerProps extends ViewProps {
  currentView: ViewType;
}

export function ViewContainer({ currentView, isResizing }: ViewContainerProps) {
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView isResizing={isResizing} />;
      case 'all-images':
        return <AllImagesView isResizing={isResizing} />;
      case 'collections':
        return <CollectionsView isResizing={isResizing} />;
      case 'folders':
        return <FoldersView isResizing={isResizing} />;
      case 'tags':
        return <TagsView isResizing={isResizing} />;
      case 'search':
        return <SearchView isResizing={isResizing} />;
      case 'files':
        return <FileView isResizing={isResizing} />;
      default:
        return <DashboardView isResizing={isResizing} />;
    }
  };

  return (
    <div className="h-full">
      {renderView()}
    </div>
  );
}
